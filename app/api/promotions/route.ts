import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeProductImage } from '@/lib/scraper';
import { generateShortId } from '@/lib/shortId';
import { ImageProcessor } from '@/lib/imageProcessor';

export async function POST(request: NextRequest) {
  let requestBody: any = {};
  
  try {
    console.log('Starting promotion creation...');
    
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.API_SECRET_KEY}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    requestBody = body;
    console.log('Request body received:', body);
    
    const { title, price, price_from, storeName, affiliateLink, coupon } = body;

    if (!title || !price || !storeName || !affiliateLink) {
      console.log('Missing required fields:', { title: !!title, price: !!price, storeName: !!storeName, affiliateLink: !!affiliateLink });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique short ID
    console.log('Generating short ID...');
    let shortId = generateShortId();
    console.log('Generated short ID:', shortId);
    
    // Ensure it's unique
    console.log('Checking for unique shortId...');
    while (await prisma.promotion.findUnique({ where: { shortId } })) {
      console.log('ShortId already exists, generating new one...');
      shortId = generateShortId();
    }
    console.log('Final shortId:', shortId);

    // Scrape and optimize the product image for WhatsApp
    console.log('Starting image scraping and optimization...');
    let imageUrl: string;
    
    try {
      // First, scrape the original image
      const originalImageUrl = await scrapeProductImage(affiliateLink, shortId);
      console.log('Image scraped successfully:', originalImageUrl);
      
      // Process and optimize the image for WhatsApp (600x600 WebP)
      console.log('Processing image for WhatsApp optimization...');
      const processingResult = await ImageProcessor.processProductImage(originalImageUrl, shortId);
      
      if (processingResult.success && processingResult.publicUrl) {
        imageUrl = ImageProcessor.getAbsoluteImageUrl(processingResult.publicUrl);
        console.log('Image optimized for WhatsApp:', imageUrl);
      } else {
        console.warn('Image optimization failed, using original:', processingResult.error);
        imageUrl = originalImageUrl;
      }
      
    } catch (error) {
      console.error('Image processing failed, using default:', error);
      // Use default SVG image optimized for WhatsApp (600x600)
      imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YzYTc1YyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHV0bzwvdGV4dD4KICA8L3N2Zz4=';
      console.log('Using default optimized image (600x600)');
    }

    // Check if affiliate link already exists
    console.log('Checking for existing affiliate link...');
    const existingPromotion = await prisma.promotion.findUnique({
      where: { affiliateLink }
    });

    if (existingPromotion) {
      console.log('Affiliate link already exists, returning existing promotion:', existingPromotion.id);
      return NextResponse.json({
        ...existingPromotion,
        siteLink: `${request.nextUrl.origin}/p/${existingPromotion.shortId}`
      }, { status: 200 }); // Return 200 instead of 201 for existing
    }

    // Check if same title exists today
    console.log('Checking for duplicate title today...');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const duplicateTitle = await prisma.promotion.findFirst({
      where: {
        title,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    if (duplicateTitle) {
      console.log('Title already exists today, returning existing promotion:', duplicateTitle.id);
      return NextResponse.json({
        ...duplicateTitle,
        siteLink: `${request.nextUrl.origin}/p/${duplicateTitle.shortId}`
      }, { status: 200 }); // Return existing promotion with same title
    }

    // Save to database
    console.log('Saving to database...');
    const promotion = await prisma.promotion.create({
      data: {
        shortId,
        title,
        price: price.toFixed(2),
        price_from: price_from ? price_from.toFixed(2) : null,
        storeName,
        affiliateLink,
        imageUrl,
        coupon,
      },
    });
    console.log('Promotion created successfully:', promotion.id);

    return NextResponse.json({
      ...promotion,
      siteLink: `${request.nextUrl.origin}/p/${promotion.shortId}`
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating promotion:', error);
    
    // Log detalhado para debug
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Log da requisição para debug
    console.error('Request data:', requestBody);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    const store = searchParams.get('store');
    const search = searchParams.get('search');
    const coupons = searchParams.get('coupons') === 'true';

    // Build where clause
    const where: any = {};
    
    if (store) {
      where.storeName = store;
    }
    
    if (search) {
      where.title = {
        contains: search
      };
    }
    
    if (coupons) {
      where.coupon = {
        not: null
      };
    }

    const promotions = await prisma.promotion.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.API_SECRET_KEY}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll');
    const startDay = searchParams.get('startDay');
    const endDay = searchParams.get('endDay');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Delete by date range
    if (startDay && endDay && month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(startDay));
      const endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(endDay) + 1); // +1 to include the end day
      
      console.log(`Deleting promotions from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const deletedCount = await prisma.promotion.deleteMany({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        }
      });
      
      return NextResponse.json({ 
        message: `Promotions deleted successfully from ${startDay}/${month}/${year} to ${endDay}/${month}/${year}. Count: ${deletedCount.count}`,
        deletedCount: deletedCount.count,
        dateRange: `${startDay}/${month}/${year} - ${endDay}/${month}/${year}`
      });
    }

    // Delete all promotions
    if (deleteAll === 'true') {
      const deletedCount = await prisma.promotion.deleteMany({});
      return NextResponse.json({ 
        message: `All promotions deleted successfully. Count: ${deletedCount.count}`,
        deletedCount: deletedCount.count 
      });
    }

    // Delete single promotion
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const deletedPromotion = await prisma.promotion.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Promotion deleted successfully', deletedPromotion });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}