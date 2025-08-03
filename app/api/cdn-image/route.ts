import { NextRequest, NextResponse } from 'next/server';

/**
 * CDN simples para imagens - apenas repassa com cache agressivo
 * Evita múltiplas requisições ao servidor de origem
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Fetch com timeout curto para evitar travamentos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    try {
      const response = await fetch(decodedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'facebookexternalhit/1.1',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Retornar com cache agressivo
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable', // 1 ano
          'CDN-Cache-Control': 'max-age=31536000',
          'Vercel-CDN-Cache-Control': 'max-age=31536000',
        },
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch timeout or error:', fetchError);
      
      // Retornar imagem placeholder em caso de erro
      const placeholder = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      return new NextResponse(placeholder, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=300', // 5 min para erros
        },
      });
    }
    
  } catch (error) {
    console.error('CDN image error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}