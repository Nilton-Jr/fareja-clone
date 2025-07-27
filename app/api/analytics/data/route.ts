import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsData } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get('days')) || 30;
    
    const analyticsData = await getAnalyticsData(days);
    
    if (!analyticsData) {
      return NextResponse.json(
        { error: 'Analytics data unavailable' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' }, 
      { status: 500 }
    );
  }
}