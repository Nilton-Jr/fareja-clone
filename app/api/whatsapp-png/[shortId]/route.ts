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

    // Generate SVG image optimized for WhatsApp - exact 1200x630 dimensions
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3a75c;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ff6b35;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bgGradient)"/>
        
        <!-- Main Container -->
        <rect x="40" y="40" width="1120" height="550" rx="30" fill="white" filter="url(#shadow)"/>
        
        <!-- Left Section Background -->
        <rect x="40" y="40" width="560" height="550" rx="30" fill="#fafafa"/>
        
        <!-- Logo -->
        <text x="100" y="140" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#f3a75c">🔍 Fareja.ai</text>
        
        <!-- Title -->
        <text x="100" y="200" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#333" text-anchor="start">
          ${promotion.title.length > 50 ? promotion.title.substring(0, 50) + '...' : promotion.title}
        </text>
        ${promotion.title.length > 50 ? `<text x="100" y="230" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#333" text-anchor="start">${promotion.title.substring(50, 100)}${promotion.title.length > 100 ? '...' : ''}</text>` : ''}
        
        <!-- Price -->
        <text x="100" y="320" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#f3a75c">R$ ${promotion.price}</text>
        
        <!-- Old Price -->
        ${promotion.price_from ? `<text x="100" y="360" font-family="Arial, sans-serif" font-size="20" fill="#999" text-decoration="line-through">De: R$ ${promotion.price_from}</text>` : ''}
        
        <!-- Discount Badge -->
        ${discount ? `
        <rect x="100" y="380" width="150" height="40" rx="20" fill="#4CAF50"/>
        <text x="175" y="405" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">-${discount}% OFF</text>
        ` : ''}
        
        <!-- Store Badge -->
        <rect x="100" y="${discount ? '440' : '400'}" width="200" height="35" rx="17" fill="#e0e0e0"/>
        <text x="200" y="${discount ? '462' : '422'}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#666" text-anchor="middle">${promotion.storeName}</text>
        
        <!-- Right Section Label -->
        <text x="1000" y="80" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#f3a75c" text-anchor="middle">Promoção</text>
        
        <!-- Product Image Placeholder -->
        <rect x="700" y="150" width="400" height="300" rx="20" fill="#f8f8f8" stroke="#ddd" stroke-width="2"/>
        <text x="900" y="310" font-family="Arial, sans-serif" font-size="18" fill="#999" text-anchor="middle">Imagem do Produto</text>
        
        <!-- Watermark -->
        <text x="1100" y="600" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="end">fareja.ai</text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    console.error('Error generating WhatsApp PNG:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}