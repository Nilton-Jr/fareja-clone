// Non-blocking analytics utilities
import { prisma } from './prisma';

// Utility to detect device type from user agent
export function getDeviceType(userAgent: string | null | undefined): string {
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
  userAgent?: string | null | undefined;
  referrer?: string | null | undefined;
  sessionId?: string | null | undefined;
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
  userAgent?: string | null | undefined;
  referrer?: string | null | undefined;
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
  userAgent?: string | null | undefined;
  referrer?: string | null | undefined;
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

// Analytics data aggregation by custom date range and filters
export async function getAnalyticsDataByDateRange(
  startDate: Date, 
  endDate: Date, 
  filters?: {
    storeName?: string;
    hasCoupon?: boolean;
  }
) {
  try {
    // Safer parallel queries with individual error handling
    const [
      totalPageViews,
      uniqueVisitors,
      totalClicks,
      topPages,
      topPromotions,
      deviceStats,
      dailyStats
    ] = await Promise.allSettled([
      // Total page views
      prisma.analytics.count({
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          } 
        }
      }),
      
      // Unique visitors (by session)
      prisma.analytics.findMany({
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          } 
        },
        select: { sessionId: true },
        distinct: ['sessionId']
      }),
      
      // Total clicks
      prisma.promotionClick.count({
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          },
          promotion: filters?.storeName || filters?.hasCoupon !== undefined ? {
            storeName: filters?.storeName ? { contains: filters.storeName, mode: 'insensitive' } : undefined,
            coupon: filters?.hasCoupon !== undefined ? 
              (filters.hasCoupon ? { not: null } : null) : undefined
          } : undefined
        }
      }),
      
      // Top pages
      prisma.analytics.groupBy({
        by: ['page'],
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          } 
        },
        _count: { page: true },
        orderBy: { _count: { page: 'desc' } },
        take: 10
      }),
      
      // Top clicked promotions with store and coupon info
      prisma.promotionClick.findMany({
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          },
          promotion: filters?.storeName || filters?.hasCoupon !== undefined ? {
            storeName: filters?.storeName ? { contains: filters.storeName, mode: 'insensitive' } : undefined,
            coupon: filters?.hasCoupon !== undefined ? 
              (filters.hasCoupon ? { not: null } : null) : undefined
          } : undefined
        },
        include: {
          promotion: {
            select: {
              id: true,
              title: true,
              storeName: true,
              coupon: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 100 
      }),
      
      // Device statistics
      prisma.analytics.groupBy({
        by: ['device'],
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          } 
        },
        _count: { device: true }
      }),
      
      // Daily statistics for the date range
      prisma.analytics.findMany({
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          } 
        },
        select: {
          timestamp: true,
          sessionId: true
        },
        orderBy: { timestamp: 'desc' },
        take: 100
      })
    ]);

    // Extract values from settled promises with fallbacks
    const getSettledValue = (result: any, fallback: any) => 
      result.status === 'fulfilled' ? result.value : fallback;

    const pageViews = getSettledValue(totalPageViews, 0);
    const visitors = getSettledValue(uniqueVisitors, []);
    const clicks = getSettledValue(totalClicks, 0);
    const pages = getSettledValue(topPages, []);
    const promotionClicks = getSettledValue(topPromotions, []);
    const devices = getSettledValue(deviceStats, []);
    const daily = getSettledValue(dailyStats, []);

    // Process promotion clicks to group by promotion and include store/coupon info
    const promotionMap = new Map();
    promotionClicks.forEach((click: any) => {
      const promotion = click.promotion;
      const key = promotion.id;
      
      if (promotionMap.has(key)) {
        promotionMap.get(key).clickCount++;
      } else {
        promotionMap.set(key, {
          promotionId: promotion.id,
          title: promotion.title,
          storeName: promotion.storeName,
          hasCoupon: !!promotion.coupon,
          coupon: promotion.coupon,
          clickCount: 1
        });
      }
    });

    const topPromotionsWithInfo = Array.from(promotionMap.values())
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 10);

    // Get store statistics
    const storeStats = new Map();
    promotionClicks.forEach((click: any) => {
      const storeName = click.promotion.storeName;
      if (storeStats.has(storeName)) {
        storeStats.get(storeName).clicks++;
      } else {
        storeStats.set(storeName, {
          storeName,
          clicks: 1
        });
      }
    });

    const topStores = Array.from(storeStats.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Get coupon statistics
    const couponStats = {
      withCoupon: 0,
      withoutCoupon: 0
    };
    
    promotionClicks.forEach((click: any) => {
      if (click.promotion.coupon) {
        couponStats.withCoupon++;
      } else {
        couponStats.withoutCoupon++;
      }
    });

    return {
      totalPageViews: pageViews,
      uniqueVisitors: visitors.length,
      totalClicks: clicks,
      topPages: pages,
      topPromotions: topPromotionsWithInfo,
      topStores: topStores,
      couponStats: couponStats,
      deviceStats: devices,
      dailyStats: daily,
      conversionRate: pageViews > 0 ? ((clicks / pageViews) * 100).toFixed(2) : '0'
    };
  } catch (error) {
    console.error('Error fetching analytics data by date range:', error);
    return null;
  }
}

// Analytics data aggregation functions with filters
export async function getAnalyticsData(
  days: number = 30,
  filters?: {
    storeName?: string;
    hasCoupon?: boolean;
  }
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Safer parallel queries with individual error handling
    const [
      totalPageViews,
      uniqueVisitors,
      totalClicks,
      topPages,
      topPromotions,
      deviceStats,
      dailyStats
    ] = await Promise.allSettled([
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
        where: { 
          timestamp: { gte: startDate },
          promotion: filters?.storeName || filters?.hasCoupon !== undefined ? {
            storeName: filters?.storeName ? { contains: filters.storeName, mode: 'insensitive' } : undefined,
            coupon: filters?.hasCoupon !== undefined ? 
              (filters.hasCoupon ? { not: null } : null) : undefined
          } : undefined
        }
      }),
      
      // Top pages
      prisma.analytics.groupBy({
        by: ['page'],
        where: { timestamp: { gte: startDate } },
        _count: { page: true },
        orderBy: { _count: { page: 'desc' } },
        take: 10
      }),
      
      // Top clicked promotions with store and coupon info
      prisma.promotionClick.findMany({
        where: { 
          timestamp: { gte: startDate },
          promotion: filters?.storeName || filters?.hasCoupon !== undefined ? {
            storeName: filters?.storeName ? { contains: filters.storeName, mode: 'insensitive' } : undefined,
            coupon: filters?.hasCoupon !== undefined ? 
              (filters.hasCoupon ? { not: null } : null) : undefined
          } : undefined
        },
        include: {
          promotion: {
            select: {
              id: true,
              title: true,
              storeName: true,
              coupon: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 100 
      }),
      
      // Device statistics
      prisma.analytics.groupBy({
        by: ['device'],
        where: { timestamp: { gte: startDate } },
        _count: { device: true }
      }),
      
      // Daily statistics for the last 30 days (using simpler findMany)
      prisma.analytics.findMany({
        where: { timestamp: { gte: startDate } },
        select: {
          timestamp: true,
          sessionId: true
        },
        orderBy: { timestamp: 'desc' },
        take: 100
      })
    ]);

    // Extract values from settled promises with fallbacks
    const getSettledValue = (result: any, fallback: any) => 
      result.status === 'fulfilled' ? result.value : fallback;

    const pageViews = getSettledValue(totalPageViews, 0);
    const visitors = getSettledValue(uniqueVisitors, []);
    const clicks = getSettledValue(totalClicks, 0);
    const pages = getSettledValue(topPages, []);
    const promotionClicks = getSettledValue(topPromotions, []);
    const devices = getSettledValue(deviceStats, []);
    const daily = getSettledValue(dailyStats, []);

    // Process promotion clicks to group by promotion and include store/coupon info
    const promotionMap = new Map();
    promotionClicks.forEach((click: any) => {
      const promotion = click.promotion;
      const key = promotion.id;
      
      if (promotionMap.has(key)) {
        promotionMap.get(key).clickCount++;
      } else {
        promotionMap.set(key, {
          promotionId: promotion.id,
          title: promotion.title,
          storeName: promotion.storeName,
          hasCoupon: !!promotion.coupon,
          coupon: promotion.coupon,
          clickCount: 1
        });
      }
    });

    const topPromotionsWithInfo = Array.from(promotionMap.values())
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 10);

    // Get store statistics
    const storeStats = new Map();
    promotionClicks.forEach((click: any) => {
      const storeName = click.promotion.storeName;
      if (storeStats.has(storeName)) {
        storeStats.get(storeName).clicks++;
      } else {
        storeStats.set(storeName, {
          storeName,
          clicks: 1
        });
      }
    });

    const topStores = Array.from(storeStats.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Get coupon statistics
    const couponStats = {
      withCoupon: 0,
      withoutCoupon: 0
    };
    
    promotionClicks.forEach((click: any) => {
      if (click.promotion.coupon) {
        couponStats.withCoupon++;
      } else {
        couponStats.withoutCoupon++;
      }
    });

    return {
      totalPageViews: pageViews,
      uniqueVisitors: visitors.length,
      totalClicks: clicks,
      topPages: pages,
      topPromotions: topPromotionsWithInfo,
      topStores: topStores,
      couponStats: couponStats,
      deviceStats: devices,
      dailyStats: daily,
      conversionRate: pageViews > 0 ? ((clicks / pageViews) * 100).toFixed(2) : '0'
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return null;
  }
}