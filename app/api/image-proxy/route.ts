import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const MAX_IMAGE_SIZE_KB = 300; // WhatsApp recommendation
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_KB * 1024;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const width = parseInt(searchParams.get('w') || '1200');
    const quality = parseInt(searchParams.get('q') || '85');
    
    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Fetch the image from the original source
    const imageResponse = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatsApp)',
      },
    });

    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: 500 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Process image with sharp to ensure optimization
    let processedImage = sharp(Buffer.from(imageBuffer))
      .resize(width, Math.round(width / 1.91), { // 1.91:1 aspect ratio for WhatsApp
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .jpeg({ quality, progressive: true }); // JPEG for better WhatsApp compatibility
    
    let optimizedBuffer = await processedImage.toBuffer();
    
    // If image is still too large, reduce quality iteratively
    let currentQuality = quality;
    while (optimizedBuffer.length > MAX_IMAGE_SIZE_BYTES && currentQuality > 20) {
      currentQuality -= 10;
      optimizedBuffer = await sharp(Buffer.from(imageBuffer))
        .resize(width, Math.round(width / 1.91), {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({ quality: currentQuality, progressive: true })
        .toBuffer();
    }
    
    // Log optimization results
    const originalSizeKB = (imageBuffer.byteLength / 1024).toFixed(2);
    const optimizedSizeKB = (optimizedBuffer.length / 1024).toFixed(2);
    console.log(`Image optimized: ${originalSizeKB}KB → ${optimizedSizeKB}KB (quality: ${currentQuality})`);

    // Return the optimized image with proper headers for WhatsApp
    return new NextResponse(optimizedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'X-Image-Size': `${optimizedSizeKB}KB`,
        'X-Image-Quality': currentQuality.toString(),
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}