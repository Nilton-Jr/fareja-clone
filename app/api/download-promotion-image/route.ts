import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

/**
 * API Route para download de imagens de promoções
 * Este endpoint roda APÓS a criação da promoção para baixar a imagem
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, shortId, buffer: base64Buffer } = body;

    if (!shortId || (!imageUrl && !base64Buffer)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`🔄 Post-processing image download for ${shortId}`);

    let buffer: ArrayBuffer;
    let contentType = 'image/jpeg';

    // Se temos o buffer base64, usar ele
    if (base64Buffer) {
      buffer = Buffer.from(base64Buffer, 'base64').buffer;
      console.log('Using provided base64 buffer');
    } else {
      // Senão, fazer download
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
      });

      if (!response.ok) {
        console.error(`Failed to download image: ${response.status}`);
        return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
      }

      buffer = await response.arrayBuffer();
      contentType = response.headers.get('content-type') || 'image/jpeg';
    }
    
    // Determinar extensão
    let extension = 'jpg';
    if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('png')) extension = 'png';
    
    const filename = `${shortId}.${extension}`;
    const publicPath = path.join(process.cwd(), 'public', 'images', 'products', filename);
    
    // Salvar arquivo
    await writeFile(publicPath, Buffer.from(buffer));
    
    const localUrl = `/images/products/${filename}`;
    console.log(`✅ Image saved to public: ${localUrl} (${Math.round(buffer.byteLength / 1024)}KB)`);

    return NextResponse.json({
      success: true,
      localUrl,
      size: buffer.byteLength
    });

  } catch (error) {
    console.error('Error in download-promotion-image:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}