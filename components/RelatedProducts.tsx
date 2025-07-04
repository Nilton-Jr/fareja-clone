'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getStoreLogo } from '@/lib/storeLogo';

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

interface RelatedProductsProps {
  currentProductId: string;
  title: string;
}

export default function RelatedProducts({ currentProductId, title }: RelatedProductsProps) {
  const [products, setProducts] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch(`/api/promotions?limit=20`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Filtrar produto atual e pegar apenas 10 produtos relacionados
          const filtered = data
            .filter((product: Promotion) => product.id !== currentProductId)
            .slice(0, 10);
          setProducts(filtered);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos relacionados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [currentProductId]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) {
      return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    } else if (diffInHours > 0) {
      return `há ${diffInHours}h`;
    } else {
      return 'há poucos minutos';
    }
  };

  const calculateDiscount = (promotion: Promotion) => {
    if (!promotion.price_from) return null;
    
    const priceFrom = parseFloat(promotion.price_from.replace(/[^\d,]/g, '').replace(',', '.'));
    const price = parseFloat(promotion.price.replace(/[^\d,]/g, '').replace(',', '.'));
    
    if (priceFrom && price) {
      const discount = Math.round(((priceFrom - price) / priceFrom) * 100);
      return discount > 0 ? discount : null;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="my-8">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="my-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {products.map((product) => {
          const discount = calculateDiscount(product);
          return (
            <div key={product.id} className="flex-shrink-0 w-48">
              <Link href={`/p/${product.shortId}`} className="block">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
                  {/* Discount Badge */}
                  {discount && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        -{discount}%
                      </span>
                    </div>
                  )}
                  
                  <div className="relative h-32 w-full bg-white flex items-center justify-center">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-contain p-2"
                      sizes="192px"
                    />
                    {/* Store Logo */}
                    <div className="absolute bottom-1 right-1">
                      <Image
                        src={getStoreLogo(product.storeName)}
                        alt={`${product.storeName} logo`}
                        width={20}
                        height={20}
                        className="rounded-sm shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {product.storeName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(product.createdAt)}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 h-10">
                      {product.title}
                    </h3>
                    
                    <div className="flex flex-col gap-1 mb-2">
                      {product.price_from && (
                        <span className="text-xs text-gray-500 line-through">
                          {product.price_from.startsWith('R$') ? product.price_from : `R$ ${product.price_from}`}
                        </span>
                      )}
                      <span className="text-sm font-bold text-orange-500">
                        {product.price.startsWith('R$') ? product.price : `R$ ${product.price}`}
                      </span>
                    </div>
                    
                    {product.coupon && (
                      <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                        Cupom: {product.coupon}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}