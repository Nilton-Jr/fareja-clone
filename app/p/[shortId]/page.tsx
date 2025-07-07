import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import ProductHeader from '@/components/ProductHeader';
import RelatedProducts from '@/components/RelatedProducts';
import MorePromotions from '@/components/MorePromotions';

interface PageProps {
  params: Promise<{
    shortId: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { shortId } = await params;

  try {
    const promotion = await prisma.promotion.findUnique({
      where: {
        shortId: shortId,
      },
    });

    if (!promotion) {
      notFound();
    }

    const formatTimeAgo = (date: Date) => {
      const now = new Date();
      const diffInMs = now.getTime() - new Date(date).getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInDays > 0) {
        return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
      } else if (diffInHours > 0) {
        return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
      } else {
        return 'Há poucos minutos';
      }
    };

    const calculateDiscount = () => {
      if (!promotion.price_from) return null;
      
      const priceFrom = parseFloat(promotion.price_from.replace(/[^\d,]/g, '').replace(',', '.'));
      const price = parseFloat(promotion.price.replace(/[^\d,]/g, '').replace(',', '.'));
      
      if (priceFrom && price) {
        const discount = Math.round(((priceFrom - price) / priceFrom) * 100);
        return discount > 0 ? discount : null;
      }
      return null;
    };

    const discount = calculateDiscount();

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header Stripe - Sticky */}
        <ProductHeader />

        {/* WhatsApp Sidebar */}
        <div className="fixed right-4 top-24 z-40 hidden lg:block">
          <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-xs">
            <div className="text-center">
              <div className="text-2xl mb-2">📱</div>
              <div className="font-bold text-sm mb-2">Grupo VIP WhatsApp</div>
              <div className="text-xs mb-3">Receba as melhores ofertas em primeira mão!</div>
              <a
                href="https://chat.whatsapp.com/exemplo"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-green-500 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors block"
              >
                Entrar no Grupo
              </a>
            </div>
          </div>
        </div>

        {/* Product Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Product Image */}
              <div className="relative h-80 w-full bg-white flex items-center justify-center">
                <Image
                  src={promotion.imageUrl}
                  alt={promotion.title}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Product Info */}
              <div className="p-6">
                {/* Store and Time */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {promotion.storeName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(promotion.createdAt)}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl font-bold text-gray-800 mb-4 leading-tight">
                  {promotion.title}
                </h1>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold text-orange-500">
                      {promotion.price}
                    </span>
                    {promotion.price_from && (
                      <span className="text-lg text-gray-500 line-through">
                        {promotion.price_from}
                      </span>
                    )}
                    {discount && (
                      <span className="bg-green-500 text-white text-sm px-2 py-1 rounded-full font-bold">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  
                  {promotion.coupon && (
                    <div className="bg-orange-100 text-orange-800 text-sm px-3 py-2 rounded-lg inline-block">
                      <span className="font-medium">Cupom:</span> {promotion.coupon}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    href={promotion.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-4 px-6 rounded-lg font-bold text-lg transition-colors duration-200"
                  >
                    Ver Oferta na {promotion.storeName}
                  </Link>
                  
                  <div className="text-center text-sm text-gray-500">
                    <p>📦 Frete pode variar conforme sua localização</p>
                    <p>⚡ Oferta por tempo limitado</p>
                  </div>
                </div>

                {/* Back to site */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                  <Link
                    href="/"
                    className="text-orange-500 hover:text-orange-600 text-sm"
                  >
                    ← Voltar para mais ofertas
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          <div className="max-w-6xl mx-auto">
            <RelatedProducts 
              currentProductId={promotion.id} 
              title="Você também vai gostar"
            />
          </div>

          {/* More Promotions Section */}
          <div className="max-w-6xl mx-auto">
            <MorePromotions currentProductId={promotion.id} />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#151E3E] text-white p-4 mt-12">
          <div className="container mx-auto text-center">
            <p>&copy; 2024 Fareja. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('Erro ao buscar promoção:', error);
    notFound();
  }
}

// META TAGS OTIMIZADAS PARA WHATSAPP - MELHORES PRÁTICAS
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shortId } = await params;

  try {
    const promotion = await prisma.promotion.findUnique({
      where: {
        shortId: shortId,
      },
    });

    if (!promotion) {
      return {
        title: 'Promoção não encontrada - Fareja',
        description: 'Esta promoção não foi encontrada ou pode ter expirado.',
      };
    }

    // Calcular desconto para incluir na descrição
    const calculateDiscount = () => {
      if (!promotion.price_from) return null;
      const priceFrom = parseFloat(promotion.price_from.replace(/[^\d,]/g, '').replace(',', '.'));
      const price = parseFloat(promotion.price.replace(/[^\d,]/g, '').replace(',', '.'));
      if (priceFrom && price) {
        return Math.round(((priceFrom - price) / priceFrom) * 100);
      }
      return null;
    };

    const discount = calculateDiscount();
    
    // Base URL com HTTPS obrigatório para WhatsApp
    const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const baseUrl = rawBaseUrl.replace('http://', 'https://');
    const pageUrl = `${baseUrl}/p/${shortId}`;

    // Título otimizado para WhatsApp (máximo 60 caracteres para melhor exibição)
    const title = promotion.title.length > 45 
      ? `${promotion.title.substring(0, 45)}... - ${promotion.price}`
      : `${promotion.title} - ${promotion.price}`;

    // Descrição otimizada para WhatsApp (máximo 160 caracteres)
    let description;
    if (discount) {
      description = `🔥${discount}% OFF! Corre que acaba rápido!`;
    } else {
      description = `🔥Corre que acaba rápido!`;
    }

    // Garantir que a imagem seja absoluta e HTTPS para WhatsApp
    let imageUrl = promotion.imageUrl;
    if (!imageUrl.startsWith('http')) {
      imageUrl = `${baseUrl}${promotion.imageUrl}`;
    } else {
      imageUrl = imageUrl.replace('http://', 'https://');
    }
    
    // URL segura para WhatsApp
    const secureImageUrl = imageUrl.replace('http://', 'https://');
    
    // Alt text otimizado para a imagem
    const imageAlt = `${promotion.title} - ${promotion.storeName} - ${promotion.price}`;

    return {
      title: title,
      description: description,
      keywords: `promoção, oferta, desconto, ${promotion.storeName}, ${promotion.title}, cupom, barato`,
      
      // OPEN GRAPH OTIMIZADO PARA WHATSAPP - SEGUINDO TODAS AS MELHORES PRÁTICAS
      openGraph: {
        title: title,
        description: description,
        url: pageUrl,
        siteName: 'Fareja - As Melhores Promoções',
        locale: 'pt_BR',
        type: 'website', // Tipo compatível com Next.js TypeScript
        
        // IMAGEM PRINCIPAL OTIMIZADA PARA WHATSAPP (600x600 WebP)
        images: [
          {
            url: secureImageUrl,
            secureUrl: secureImageUrl,
            width: 600,
            height: 600,
            alt: imageAlt,
          }
        ],
      },
      
      // TWITTER CARD PARA OUTRAS PLATAFORMAS
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [imageUrl],
        site: '@fareja',
        creator: '@fareja',
      },
      
      // ROBOTS E SEO
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      
      // METADADOS ADICIONAIS PARA MELHOR SEO
      alternates: {
        canonical: pageUrl,
      },
      
      // META TAGS ESPECÍFICAS PARA WHATSAPP E REDES SOCIAIS
      other: {
        // OpenGraph product-specific tags (para WhatsApp reconhecer como produto)
        'og:type': 'product',
        'og:product:price:amount': promotion.price.replace(/[^\d,]/g, '').replace(',', '.'),
        'og:product:price:currency': 'BRL',
        'og:product:availability': 'in stock',
        'og:product:condition': 'new',
        'og:product:brand': promotion.storeName,
        
        // Meta tags específicas do WhatsApp para garantir preview perfeito
        'og:image:width': '600',
        'og:image:height': '600',
        'og:image:type': 'image/webp',
        'og:image:alt': imageAlt,
        'og:image:secure_url': secureImageUrl,
        
        // Meta tags adicionais para melhor compatibilidade
        'twitter:image:width': '600',
        'twitter:image:height': '600',
        'twitter:image:alt': imageAlt,
        'twitter:card': 'summary_large_image',
      },
    };
  } catch (error) {
    console.error('Erro ao gerar metadata:', error);
    return {
      title: 'Erro ao carregar promoção - Fareja',
      description: 'Ocorreu um erro ao carregar esta promoção. Tente novamente.',
    };
  }
}