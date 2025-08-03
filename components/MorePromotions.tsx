'use client';

import { useEffect, useState } from 'react';
import PromotionCard from './PromotionCard';

interface Promotion {
  id: string;
  shortId: string;
  title: string;
  price: string;
  price_from?: string;
  storeName: string;
  affiliateLink: string;
  imageUrl: string;
  coupon?: string;
  createdAt: Date;
}

interface MorePromotionsProps {
  currentProductId: string;
}

export default function MorePromotions({ currentProductId }: MorePromotionsProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPromotions = async (pageNum: number) => {
    try {
      const response = await fetch(`/api/promotions?page=${pageNum}&limit=20`);
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        setHasMore(false);
        if (pageNum === 1) {
          setPromotions([]);
        }
      } else {
        // Filtrar produto atual
        const filtered = data.filter((promotion: Promotion) => promotion.id !== currentProductId);
        setPromotions(prev => pageNum === 1 ? filtered : [...prev, ...filtered]);
      }
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions(1);
  }, [currentProductId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setLoading(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPromotions(nextPage);
    }
  };

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 1000) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page]);

  if (loading && promotions.length === 0) {
    return (
      <div className="my-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Veja mais promoções do dia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Veja mais promoções do dia</h2>
      
      {promotions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {promotions.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
          
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
              ))}
            </div>
          )}
          
          {!hasMore && (
            <p className="text-center text-gray-500 mt-8">
              Você viu todas as promoções disponíveis!
            </p>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500">
          Nenhuma promoção encontrada.
        </p>
      )}
    </div>
  );
}