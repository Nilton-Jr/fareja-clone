'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { trackPromotionClick, trackPromotionView, usePageView } from '@/hooks/useAnalytics';

interface Promotion {
  id: string;
  shortId: string;
  title: string;
  price: string;
  price_from?: string | null;
  storeName: string;
  affiliateLink: string;
  imageUrl: string;
  coupon?: string | null;
  createdAt: Date;
}

interface ProductPageClientProps {
  promotion: Promotion;
}

export default function ProductPageClient({ promotion }: ProductPageClientProps) {
  // Track page view
  usePageView(`/p/${promotion.shortId}`);

  // Track promotion view
  useEffect(() => {
    trackPromotionView(promotion.id, 'full_page');
  }, [promotion.id]);

  return (
    <>
      {/* Action Buttons */}
      <div className="space-y-3">
        <Link
          href={promotion.affiliateLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-3 md:py-4 px-4 md:px-6 rounded-lg font-bold text-base md:text-lg transition-colors duration-200"
          onClick={() => trackPromotionClick(promotion.id, 'pegar_promocao_produto')}
        >
          Pegar Promoção
        </Link>
        
        <div className="text-center text-xs md:text-sm text-gray-500 space-y-1">
          <p>📦 Frete pode variar conforme sua localização</p>
          <p>⚡ Oferta por tempo limitado</p>
        </div>
      </div>

      {/* Back to site */}
      <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200 text-center">
        <Link
          href="/"
          className="text-orange-500 hover:text-orange-600 text-sm"
        >
          ← Voltar para mais ofertas
        </Link>
      </div>
    </>
  );
}