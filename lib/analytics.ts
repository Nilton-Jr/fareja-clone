// Non-blocking analytics utilities
import { prisma } from './prisma';

// Utility to detect device type from user agent
export function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  return 'desktop';
}

// Utility to get country from IP (placeholder - you can integrate with a service)
export async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    // In production, you might use a service like ipapi.co or MaxMind
    // For now, return null to avoid external dependencies
    return null;
  } catch (error) {
    console.error('Error getting country from IP:', error);
    return null;
  }
}

// Non-blocking page view tracking
export async function trackPageView(data: {
  page: string;
  userAgent?: string | null;
  referrer?: string | null;
  sessionId?: string | null;
}): Promise<void> {
  try {
    // Run async without blocking the main thread
    setImmediate(async () => {
      await prisma.analytics.create({
        data: {
          page: data.page,
          userAgent: data.userAgent,
          referrer: data.referrer,
          sessionId: data.sessionId,
          device: getDeviceType(data.userAgent),
          // country and city can be added later with IP geolocation
        }
      });
    });
  } catch (error) {
    // Silently fail to not impact user experience
    console.error('Analytics tracking error:', error);
  }
}

// Non-blocking promotion click tracking
export async function trackPromotionClick(data: {
  promotionId: string;
  buttonType: string;
  userAgent?: string | null;
  referrer?: string | null;
}): Promise<void> {
  try {
    setImmediate(async () => {
      await prisma.promotionClick.create({
        data: {
          promotionId: data.promotionId,
          buttonType: data.buttonType,
          userAgent: data.userAgent,
          referrer: data.referrer,
          device: getDeviceType(data.userAgent),
        }
      });
    });
  } catch (error) {
    console.error('Promotion click tracking error:', error);
  }
}

// Non-blocking promotion view tracking
export async function trackPromotionView(data: {
  promotionId: string;
  viewType: string;
  userAgent?: string | null;
  referrer?: string | null;
}): Promise<void> {
  try {
    setImmediate(async () => {
      await prisma.promotionView.create({
        data: {
          promotionId: data.promotionId,
          viewType: data.viewType,
          userAgent: data.userAgent,
          referrer: data.referrer,
          device: getDeviceType(data.userAgent),
        }
      });
    });
  } catch (error) {
    console.error('Promotion view tracking error:', error);
  }
}

// Analytics data aggregation functions
export async function getAnalyticsData(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const [
      totalPageViews,
      uniqueVisitors,
      totalClicks,
      topPages,
      topPromotions,
      deviceStats,
      dailyStats
    ] = await Promise.all([
      // Total page views
      prisma.analytics.count({
        where: { timestamp: { gte: startDate } }
      }),
      
      // Unique visitors (by session)
      prisma.analytics.findMany({
        where: { timestamp: { gte: startDate } },
        select: { sessionId: true },
        distinct: ['sessionId']
      }),
      
      // Total clicks
      prisma.promotionClick.count({
        where: { timestamp: { gte: startDate } }
      }),
      
      // Top pages
      prisma.analytics.groupBy({
        by: ['page'],
        where: { timestamp: { gte: startDate } },
        _count: { page: true },
        orderBy: { _count: { page: 'desc' } },
        take: 10
      }),
      
      // Top clicked promotions
      prisma.promotionClick.groupBy({
        by: ['promotionId'],
        where: { timestamp: { gte: startDate } },
        _count: { promotionId: true },
        orderBy: { _count: { promotionId: 'desc' } },
        take: 10
      }),
      
      // Device statistics
      prisma.analytics.groupBy({
        by: ['device'],
        where: { timestamp: { gte: startDate } },
        _count: { device: true }
      }),
      
      // Daily statistics for the last 30 days
      prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as views,
          COUNT(DISTINCT "sessionId") as unique_visitors
        FROM "Analytics"
        WHERE timestamp >= ${startDate}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    return {
      totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      totalClicks,
      topPages,
      topPromotions,
      deviceStats,
      dailyStats,
      conversionRate: totalPageViews > 0 ? ((totalClicks / totalPageViews) * 100).toFixed(2) : '0'
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return null;
  }
}