import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
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
    
    // Get date range parameters
    const startDay = searchParams.get('startDay');
    const endDay = searchParams.get('endDay');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    if (!startDay || !endDay || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required date parameters: startDay, endDay, month, year' }, 
        { status: 400 }
      );
    }
    
    // Create date range
    const startDate = new Date(Number(year), Number(month) - 1, Number(startDay));
    const endDate = new Date(Number(year), Number(month) - 1, Number(endDay), 23, 59, 59);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date parameters' }, 
        { status: 400 }
      );
    }
    
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' }, 
        { status: 400 }
      );
    }
    
    // Delete analytics data in the specified date range
    const [analyticsDeleted, clicksDeleted, viewsDeleted] = await Promise.allSettled([
      // Delete analytics entries
      prisma.analytics.deleteMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Delete promotion clicks
      prisma.promotionClick.deleteMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Delete promotion views
      prisma.promotionView.deleteMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);
    
    // Extract counts from results
    const analyticsCount = analyticsDeleted.status === 'fulfilled' ? analyticsDeleted.value.count : 0;
    const clicksCount = clicksDeleted.status === 'fulfilled' ? clicksDeleted.value.count : 0;
    const viewsCount = viewsDeleted.status === 'fulfilled' ? viewsDeleted.value.count : 0;
    
    const totalDeleted = analyticsCount + clicksCount + viewsCount;
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted analytics data from ${startDate.toLocaleDateString('pt-BR')} to ${endDate.toLocaleDateString('pt-BR')}`,
      deletedCounts: {
        analytics: analyticsCount,
        promotionClicks: clicksCount,
        promotionViews: viewsCount,
        total: totalDeleted
      }
    });
    
  } catch (error) {
    console.error('Analytics delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete analytics data' }, 
      { status: 500 }
    );
  }
}