import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsData, getAnalyticsDataByDateRange } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    // Check API key authentication
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.API_SECRET_KEY || 'farejai-secure-2024-admin-key';
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' }, 
        { status: 401 }
      );
    }
    
    const apiKey = authHeader.replace('Bearer ', '');
    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid API key' }, 
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Check if custom date range is provided
    const startDay = searchParams.get('startDay');
    const endDay = searchParams.get('endDay');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    let analyticsData;
    
    if (startDay && endDay && month && year) {
      // Custom date range
      const startDate = new Date(Number(year), Number(month) - 1, Number(startDay));
      const endDate = new Date(Number(year), Number(month) - 1, Number(endDay), 23, 59, 59);
      analyticsData = await getAnalyticsDataByDateRange(startDate, endDate);
    } else {
      // Default days range
      const days = Number(searchParams.get('days')) || 30;
      analyticsData = await getAnalyticsData(days);
    }
    
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