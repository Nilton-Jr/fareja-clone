import { NextRequest, NextResponse } from 'next/server';
import { prewarmImageCache } from '@/lib/imageOptimizer';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    const success = await prewarmImageCache(imageUrl);
    
    return NextResponse.json({ 
      success,
      message: success ? 'Image cache warmed successfully' : 'Failed to warm image cache'
    });
  } catch (error) {
    console.error('Prewarm image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}