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
    
    // Calculate discount if available
    const calculateDiscount = () => {
      if (!promotion.price_from) return null;
      const priceFrom = parseFloat(promotion.price_from.replace(/[^\d.,]/g, '').replace(',', '.'));
      const price = parseFloat(promotion.price.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (priceFrom && price && priceFrom > price) {
        return Math.round(((priceFrom - price) / priceFrom) * 100);
      }
      return null;
    };
    
    const discount = calculateDiscount();

    // Create HTML that generates a perfect WhatsApp preview image
    // Using specific dimensions that work well with WhatsApp: 1200x630 (1.91:1 ratio)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=1200, height=630">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #f3a75c 0%, #ff6b35 100%);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              position: relative;
            }
            .container {
              background: white;
              border-radius: 30px;
              width: 1120px;
              height: 550px;
              display: flex;
              align-items: center;
              box-shadow: 0 20px 60px rgba(0,0,0,0.2);
              overflow: hidden;
              position: relative;
            }
            .left-section {
              flex: 1;
              padding: 60px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              background: #fafafa;
            }
            .right-section {
              flex: 1;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: white;
              position: relative;
            }
            .logo {
              font-size: 36px;
              font-weight: 900;
              color: #f3a75c;
              margin-bottom: 20px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #333;
              margin-bottom: 25px;
              line-height: 1.3;
              max-height: 120px;
              overflow: hidden;
            }
            .price-section {
              margin-bottom: 20px;
            }
            .price {
              font-size: 48px;
              font-weight: 900;
              color: #f3a75c;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            .old-price {
              font-size: 24px;
              color: #999;
              text-decoration: line-through;
              margin-top: 8px;
            }
            .discount-badge {
              background: #4CAF50;
              color: white;
              padding: 12px 20px;
              border-radius: 30px;
              font-weight: bold;
              font-size: 20px;
              display: inline-block;
              margin: 15px 0;
              box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
            }
            .store-badge {
              background: #e0e0e0;
              padding: 10px 20px;
              border-radius: 25px;
              color: #666;
              font-size: 18px;
              font-weight: 600;
            }
            .product-image {
              max-width: 400px;
              max-height: 400px;
              width: auto;
              height: auto;
              object-fit: contain;
              border-radius: 20px;
              box-shadow: 0 15px 35px rgba(0,0,0,0.15);
            }
            .corner-logo {
              position: absolute;
              top: 20px;
              right: 30px;
              font-size: 24px;
              color: #f3a75c;
              font-weight: bold;
            }
            .watermark {
              position: absolute;
              bottom: 20px;
              right: 30px;
              font-size: 16px;
              color: #999;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="left-section">
              <div class="logo">🔍 Fareja.ai</div>
              <div class="title">${promotion.title.length > 80 ? promotion.title.substring(0, 80) + '...' : promotion.title}</div>
              <div class="price-section">
                <div class="price">R$ ${promotion.price}</div>
                ${promotion.price_from ? `<div class="old-price">De: R$ ${promotion.price_from}</div>` : ''}
              </div>
              ${discount ? `<div class="discount-badge">-${discount}% OFF</div>` : ''}
              <div class="store-badge">${promotion.storeName}</div>
            </div>
            <div class="right-section">
              <div class="corner-logo">Promoção</div>
              ${imageUrl ? `<img src="${imageUrl}" alt="${promotion.title}" class="product-image" onerror="this.style.display='none'" />` : ''}
              <div class="watermark">fareja.ai</div>
            </div>
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