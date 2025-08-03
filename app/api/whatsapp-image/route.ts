import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

    console.log(`📸 WhatsApp image request: ${imageUrl}`);

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Fetch the image from the original source with WhatsApp-friendly headers
    const imageResponse = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      return new NextResponse('Failed to fetch image', { status: 500 });
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResponse.arrayBuffer();

    console.log(`✅ Image fetched successfully: ${Math.round(imageBuffer.byteLength / 1024)}KB, type: ${contentType}`);

    // Check if we need Sharp optimization
    const needsOptimization = imageBuffer.byteLength > 300 * 1024; // > 300KB
    
    let finalBuffer: ArrayBuffer = imageBuffer;
    let finalContentType = contentType;

    if (needsOptimization) {
      try {
        const sharp = require('sharp');
        console.log('🔧 Optimizing large image for WhatsApp...');
        
        // WhatsApp prefere imagens quadradas 256x256 ou 1200x1200
        const optimizedBuffer = await sharp(Buffer.from(imageBuffer))
          .resize(800, 800, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({
            quality: 90,
            progressive: false, // WhatsApp não precisa de progressive JPEG
            mozjpeg: false
          })
          .toBuffer();
        
        finalBuffer = optimizedBuffer.buffer;
        finalContentType = 'image/jpeg';
        console.log(`✅ Image optimized: ${Math.round(optimizedBuffer.length / 1024)}KB`);
        
      } catch (sharpError) {
        console.warn('Sharp optimization failed, using original:', sharpError);
        // Continue with original image
      }
    }

    // Return the image with optimal headers for WhatsApp
    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type': finalContentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=31536000', // 1 day browser, 1 year CDN
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Max-Age': '86400',
        // WhatsApp-specific headers
        'X-Robots-Tag': 'noindex, nofollow',
        'Referrer-Policy': 'no-referrer-when-downgrade',
      },
    });

  } catch (error) {
    console.error('WhatsApp image proxy error:', error);
    
    // Return a fallback 1x1 pixel image instead of error
    const fallbackPixel = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
      0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
    ]);
    
    return new NextResponse(fallbackPixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache for errors
      },
    });
  }
}