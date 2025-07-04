import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;
    
    const promotion = await prisma.promotion.findUnique({
      where: { shortId }
    });

    if (!promotion) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Create optimized image for WhatsApp preview
    const imageUrl = promotion.imageUrl;
    
    // If it's already an external image, return it directly
    if (imageUrl.startsWith('http')) {
      return NextResponse.redirect(imageUrl);
    }

    // For base64 or other formats, we'll create an optimized version
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #f3a75c 0%, #ff6b35 100%);
              font-family: 'Arial', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container {
              background: white;
              border-radius: 20px;
              padding: 30px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 600px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #f3a75c;
              margin-bottom: 20px;
            }
            .product-image {
              max-width: 300px;
              max-height: 300px;
              object-fit: contain;
              border-radius: 15px;
              margin: 20px 0;
              box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              margin: 20px 0;
              line-height: 1.4;
            }
            .price {
              font-size: 28px;
              font-weight: bold;
              color: #f3a75c;
              margin: 15px 0;
            }
            .discount {
              background: #4CAF50;
              color: white;
              padding: 8px 16px;
              border-radius: 25px;
              font-weight: bold;
              display: inline-block;
              margin: 10px 0;
            }
            .store {
              background: #f0f0f0;
              padding: 8px 16px;
              border-radius: 20px;
              color: #666;
              margin: 10px 0;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🔍 Fareja.ai</div>
            ${imageUrl.startsWith('data:') ? 
              `<img src="${imageUrl}" alt="${promotion.title}" class="product-image" />` :
              `<img src="${imageUrl}" alt="${promotion.title}" class="product-image" />`
            }
            <div class="title">${promotion.title}</div>
            <div class="price">R$ ${promotion.price}</div>
            ${promotion.price_from ? `
              <div class="discount">
                PROMOÇÃO: De R$ ${promotion.price_from}
              </div>
            ` : ''}
            <div class="store">${promotion.storeName}</div>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    console.error('Error generating WhatsApp image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}