import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeProductImage } from '@/lib/scraper';
import { generateShortId } from '@/lib/shortId';

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

    // Scrape the product image with optimization (com fallback para não quebrar)
    console.log('Starting image scraping...');
    let imageUrl: string;
    try {
      imageUrl = await scrapeProductImage(affiliateLink, shortId);
      console.log('Image scraped successfully:', imageUrl);
    } catch (error) {
      console.error('Erro no scraping, usando imagem padrão:', error);
      // Usar imagem padrão se scraping falhar - NUNCA quebrar por causa disso
      imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzYTc1YyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHV0bzwvdGV4dD4KICA8L3N2Zz4=';
      console.log('Using default image');
    }

    // Save to database
    console.log('Saving to database...');
    const promotion = await prisma.promotion.create({
      data: {
        shortId,
        title,
        price: price.toString(),
        price_from: price_from ? price_from.toString() : null,
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