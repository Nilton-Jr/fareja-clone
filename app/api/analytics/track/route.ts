// API endpoint for client-side analytics tracking
import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, trackPromotionClick, trackPromotionView } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Get headers for tracking
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');

    // Track different types of events
    switch (type) {
      case 'page_view':
        await trackPageView({
          page: data.page,
          userAgent,
          referrer,
          sessionId: data.sessionId
        });
        break;

      case 'promotion_click':
        await trackPromotionClick({
          promotionId: data.promotionId,
          buttonType: data.buttonType,
          userAgent,
          referrer
        });
        break;

      case 'promotion_view':
        await trackPromotionView({
          promotionId: data.promotionId,
          viewType: data.viewType,
          userAgent,
          referrer
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid tracking type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    // Return success even on error to not break user experience
    return NextResponse.json({ success: true });
  }
}