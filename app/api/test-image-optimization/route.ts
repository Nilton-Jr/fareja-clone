import { NextRequest, NextResponse } from 'next/server';
import { optimizeImageForWhatsApp } from '@/lib/imageOptimizerVercel';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');
    const shortId = searchParams.get('shortId') || 'test123';

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl parameter required' }, { status: 400 });
    }

    console.log('Testing image optimization with:', { imageUrl, shortId });
    
    const result = await optimizeImageForWhatsApp(imageUrl, shortId);
    
    console.log('Optimization result:', result);

    return NextResponse.json({
      original: imageUrl,
      optimized: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test optimization error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}