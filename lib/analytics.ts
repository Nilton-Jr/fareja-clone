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

// Helper function to parse price string to number
function parsePrice(priceString: string): number {
  if (!priceString) return 0;
  
  // Remove currency symbols, spaces, and dots (thousands separator)
  // Keep only numbers and comma (decimal separator)
  const cleanPrice = priceString
    .replace(/[R$\s.]/g, '') // Remove R$, spaces, and dots
    .replace(',', '.'); // Replace comma with dot for decimal
  
  const parsed = parseFloat(cleanPrice);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to process chart data
function processChartData(startDate: Date, endDate: Date, pageViews: any[], clicks: any[]) {
  const days: string[] = [];
  const currentDate = new Date(startDate);
  
  // Generate all days in the range
  while (currentDate <= endDate) {
    days.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Process data by day
  const chartDataByDay = days.map(day => {
    const dayStart = new Date(day + 'T00:00:00.000Z');
    const dayEnd = new Date(day + 'T23:59:59.999Z');

    // Count page views for this day
    const dailyPageViews = pageViews.filter(view => {
      const viewDate = new Date(view.timestamp);
      return viewDate >= dayStart && viewDate <= dayEnd;
    }).length;

    // Count unique visitors for this day (by sessionId)
    const uniqueSessionIds = new Set();
    pageViews.forEach(view => {
      const viewDate = new Date(view.timestamp);
      if (viewDate >= dayStart && viewDate <= dayEnd && view.sessionId) {
        uniqueSessionIds.add(view.sessionId);
      }
    });
    const dailyUniqueVisitors = uniqueSessionIds.size;

    // Count clicks for this day
    const dailyClicks = clicks.filter(click => {
      const clickDate = new Date(click.timestamp);
      return clickDate >= dayStart && clickDate <= dayEnd;
    }).length;

    return {
      date: day,
      pageViews: dailyPageViews,
      uniqueVisitors: dailyUniqueVisitors,
      clicks: dailyClicks
    };
  });

  return chartDataByDay;
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
      dailyStats,
      trafficSources,
      dailyClicks,
      promotionViews
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
            storeName: filters?.storeName ? { equals: filters.storeName } : undefined,
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
            storeName: filters?.storeName ? { equals: filters.storeName } : undefined,
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
              coupon: true,
              price: true
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
        orderBy: { timestamp: 'desc' }
      }),

      // Traffic sources (referrer analysis)
      prisma.analytics.groupBy({
        by: ['referrer'],
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          } 
        },
        _count: { referrer: true },
        orderBy: { _count: { referrer: 'desc' } }
      }),

      // Daily promotion clicks for chart
      prisma.promotionClick.findMany({
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          },
          promotion: filters?.storeName || filters?.hasCoupon !== undefined ? {
            storeName: filters?.storeName ? { equals: filters.storeName } : undefined,
            coupon: filters?.hasCoupon !== undefined ? 
              (filters.hasCoupon ? { not: null } : null) : undefined
          } : undefined
        },
        select: {
          timestamp: true
        },
        orderBy: { timestamp: 'desc' }
      }),

      // All promotion views for value calculation
      prisma.promotionView.findMany({
        where: { 
          timestamp: { 
            gte: startDate,
            lte: endDate 
          },
          promotion: filters?.storeName || filters?.hasCoupon !== undefined ? {
            storeName: filters?.storeName ? { equals: filters.storeName } : undefined,
            coupon: filters?.hasCoupon !== undefined ? 
              (filters.hasCoupon ? { not: null } : null) : undefined
          } : undefined
        },
        include: {
          promotion: {
            select: {
              price: true
            }
          }
        }
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
    const sources = getSettledValue(trafficSources, []);
    const clicksDaily = getSettledValue(dailyClicks, []);
    const views = getSettledValue(promotionViews, []);

    // Calculate total values  
    const totalViewsValue = views.reduce((sum: number, view: any) => {
      return sum + parsePrice(view.promotion.price);
    }, 0);

    const totalClicksValue = promotionClicks.reduce((sum: number, click: any) => {
      return sum + parsePrice(click.promotion.price);
    }, 0);

    // Process daily chart data
    const chartData = processChartData(startDate, endDate, daily, clicksDaily);

    // Helper function to categorize traffic sources
    const categorizeSource = (referrer: string | null): string => {
      if (!referrer || referrer === '') return 'Direto';
      
      const ref = referrer.toLowerCase();
      if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
      if (ref.includes('instagram') || ref.includes('ig.me')) return 'Instagram';
      if (ref.includes('facebook') || ref.includes('fb.com')) return 'Facebook';
      if (ref.includes('twitter') || ref.includes('t.co')) return 'Twitter';
      if (ref.includes('linkedin')) return 'LinkedIn';
      if (ref.includes('youtube')) return 'YouTube';
      if (ref.includes('google')) return 'Google';
      if (ref.includes('bing')) return 'Bing';
      if (ref.includes('yahoo')) return 'Yahoo';
      if (ref.includes('duckduckgo')) return 'DuckDuckGo';
      
      // Try to extract domain from URL
      try {
        const url = new URL(referrer.startsWith('http') ? referrer : `https://${referrer}`);
        return url.hostname.replace('www.', '');
      } catch {
        return 'Outros';
      }
    };

    // Process traffic sources
    const sourceStats = new Map();
    sources.forEach((source: any) => {
      const category = categorizeSource(source.referrer);
      if (sourceStats.has(category)) {
        sourceStats.get(category).visits += source._count.referrer;
      } else {
        sourceStats.set(category, {
          source: category,
          visits: source._count.referrer
        });
      }
    });

    const topSources = Array.from(sourceStats.values())
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

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
      trafficSources: topSources,
      chartData: chartData,
      totalViewsValue: totalViewsValue,
      totalClicksValue: totalClicksValue,
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
      dailyStats,
      trafficSources,
      dailyClicks,
      promotionViews
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
            storeName: filters?.storeName ? { equals: filters.storeName } : undefined,
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
            storeName: filters?.storeName ? { equals: filters.storeName } : undefined,
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
              coupon: true,
              price: true
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
      }),

      // Traffic sources (referrer analysis)
      prisma.analytics.groupBy({
        by: ['referrer'],
        where: { timestamp: { gte: startDate } },
        _count: { referrer: true },
        orderBy: { _count: { referrer: 'desc' } }
      }),

      // Daily promotion clicks for chart
      prisma.promotionClick.findMany({
        where: { 
          timestamp: { gte: startDate },
          promotion: filters?.storeName || filters?.hasCoupon !== undefined ? {
            storeName: filters?.storeName ? { equals: filters.storeName } : undefined,
            coupon: filters?.hasCoupon !== undefined ? 
              (filters.hasCoupon ? { not: null } : null) : undefined
          } : undefined
        },
        select: {
          timestamp: true
        },
        orderBy: { timestamp: 'desc' }
      }),

      // All promotion views for value calculation
      prisma.promotionView.findMany({
        where: { 
          timestamp: { gte: startDate },
          promotion: filters?.storeName || filters?.hasCoupon !== undefined ? {
            storeName: filters?.storeName ? { equals: filters.storeName } : undefined,
            coupon: filters?.hasCoupon !== undefined ? 
              (filters.hasCoupon ? { not: null } : null) : undefined
          } : undefined
        },
        include: {
          promotion: {
            select: {
              price: true
            }
          }
        }
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
    const sources = getSettledValue(trafficSources, []);
    const clicksDaily = getSettledValue(dailyClicks, []);
    const views = getSettledValue(promotionViews, []);

    // Calculate total values  
    const totalViewsValue = views.reduce((sum: number, view: any) => {
      return sum + parsePrice(view.promotion.price);
    }, 0);

    const totalClicksValue = promotionClicks.reduce((sum: number, click: any) => {
      return sum + parsePrice(click.promotion.price);
    }, 0);

    // Process daily chart data
    const chartData = processChartData(startDate, endDate, daily, clicksDaily);

    // Helper function to categorize traffic sources
    const categorizeSource = (referrer: string | null): string => {
      if (!referrer || referrer === '') return 'Direto';
      
      const ref = referrer.toLowerCase();
      if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
      if (ref.includes('instagram') || ref.includes('ig.me')) return 'Instagram';
      if (ref.includes('facebook') || ref.includes('fb.com')) return 'Facebook';
      if (ref.includes('twitter') || ref.includes('t.co')) return 'Twitter';
      if (ref.includes('linkedin')) return 'LinkedIn';
      if (ref.includes('youtube')) return 'YouTube';
      if (ref.includes('google')) return 'Google';
      if (ref.includes('bing')) return 'Bing';
      if (ref.includes('yahoo')) return 'Yahoo';
      if (ref.includes('duckduckgo')) return 'DuckDuckGo';
      
      // Try to extract domain from URL
      try {
        const url = new URL(referrer.startsWith('http') ? referrer : `https://${referrer}`);
        return url.hostname.replace('www.', '');
      } catch {
        return 'Outros';
      }
    };

    // Process traffic sources
    const sourceStats = new Map();
    sources.forEach((source: any) => {
      const category = categorizeSource(source.referrer);
      if (sourceStats.has(category)) {
        sourceStats.get(category).visits += source._count.referrer;
      } else {
        sourceStats.set(category, {
          source: category,
          visits: source._count.referrer
        });
      }
    });

    const topSources = Array.from(sourceStats.values())
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

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
      trafficSources: topSources,
      chartData: chartData,
      totalViewsValue: totalViewsValue,
      totalClicksValue: totalClicksValue,
      conversionRate: pageViews > 0 ? ((clicks / pageViews) * 100).toFixed(2) : '0'
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return null;
  }
}