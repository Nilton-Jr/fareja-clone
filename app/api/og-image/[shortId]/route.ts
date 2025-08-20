import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;
    
    // Buscar promoção
    const promotion = await prisma.promotion.findUnique({
      where: { shortId }
    });

    if (!promotion) {
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
              fontSize: 32,
              color: '#999',
            }}
          >
            Promoção não encontrada
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Calcular desconto
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

    // Gerar imagem usando React/JSX com @vercel/og
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: 'linear-gradient(135deg, #ff6b35 0%, #f3a75c 100%)',
            padding: '40px',
          }}
        >
          {/* Main Card */}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              backgroundColor: 'white',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Left Section */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '60px',
                backgroundColor: '#fafafa',
              }}
            >
              {/* Logo */}
              <div
                style={{
                  fontSize: '42px',
                  fontWeight: 'bold',
                  color: '#ff6b35',
                  marginBottom: '30px',
                }}
              >
                🔥 FAREJA.AI
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '40px',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {promotion.title}
              </div>

              {/* Price Section */}
              <div style={{ marginBottom: '30px' }}>
                <div
                  style={{
                    fontSize: '64px',
                    fontWeight: 'bold',
                    color: '#ff6b35',
                  }}
                >
                  R$ {promotion.price}
                </div>
                {promotion.price_from && (
                  <div
                    style={{
                      fontSize: '28px',
                      color: '#999',
                      textDecoration: 'line-through',
                      marginTop: '10px',
                    }}
                  >
                    De: R$ {promotion.price_from}
                  </div>
                )}
              </div>

              {/* Discount Badge */}
              {discount && (
                <div
                  style={{
                    display: 'inline-flex',
                    backgroundColor: '#00c853',
                    color: 'white',
                    padding: '15px 30px',
                    borderRadius: '30px',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    marginBottom: '30px',
                    alignSelf: 'flex-start',
                  }}
                >
                  {discount}% OFF
                </div>
              )}

              {/* Store Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: '#e0e0e0',
                  color: '#666',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  fontSize: '24px',
                  fontWeight: '600',
                  alignSelf: 'flex-start',
                }}
              >
                {promotion.storeName}
              </div>
            </div>

            {/* Right Section */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                position: 'relative',
              }}
            >
              {/* Product Image Area */}
              <div
                style={{
                  width: '440px',
                  height: '350px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '40px',
                  overflow: 'hidden',
                }}
              >
                {promotion.imageUrl && !promotion.imageUrl.startsWith('data:') ? (
                  <img
                    src={promotion.imageUrl}
                    alt={promotion.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '24px', color: '#bbb' }}>
                    Imagem do Produto
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <div
                style={{
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  padding: '20px 60px',
                  borderRadius: '30px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                }}
              >
                👉 VER OFERTA
              </div>

              {/* Watermark */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '30px',
                  fontSize: '16px',
                  color: '#999',
                }}
              >
                fareja.ai
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        // Importante: headers para otimização do WhatsApp
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Type': 'image/png',
        },
      }
    );
    
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f44336',
            fontSize: 32,
            color: 'white',
          }}
        >
          Erro ao carregar imagem
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}