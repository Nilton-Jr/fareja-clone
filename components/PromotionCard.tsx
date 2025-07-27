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

interface PromotionCardProps {
  promotion: Promotion;
}

export default function PromotionCard({ promotion }: PromotionCardProps) {
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
    if (!promotion.price_from || !promotion.price) return null;
    
    // Handle both string and number formats
    const cleanPrice = (value: string | number) => {
      const str = typeof value === 'string' ? value : value.toString();
      // Remove everything except digits, comma and dot
      const cleaned = str.replace(/[^\d.,]/g, '');
      // Replace comma with dot for decimal parsing
      return parseFloat(cleaned.replace(',', '.'));
    };
    
    const priceFrom = cleanPrice(promotion.price_from);
    const price = cleanPrice(promotion.price);
    
    if (priceFrom && price && priceFrom > price && priceFrom > 0) {
      const discount = Math.round(((priceFrom - price) / priceFrom) * 100);
      return discount > 0 ? discount : null;
    }
    return null;
  };

  const discount = calculateDiscount();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative flex flex-col h-full">
      {/* Discount Badge */}
      {discount && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            -{discount}%
          </span>
        </div>
      )}
      
      {/* Clickable area for product page - flex-grow para ocupar espaço disponível */}
      <Link href={`/p/${promotion.shortId}`} target="_blank" rel="noopener noreferrer" className="flex-grow flex flex-col">
        <div className="cursor-pointer flex-grow flex flex-col">
          <div className="relative h-48 w-full bg-white flex items-center justify-center">
            <Image
              src={promotion.imageUrl}
              alt={promotion.title}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            {/* Store Logo */}
            <div className="absolute bottom-2 right-2">
              <Image
                src={getStoreLogo(promotion.storeName)}
                alt={`${promotion.storeName} logo`}
                width={32}
                height={32}
                className="rounded-md shadow-sm"
              />
            </div>
          </div>
          
          <div className="p-4 pb-2 flex-grow flex flex-col">
            <div className="flex items-center justify-end mb-2">
              <span className="text-xs text-gray-500">
                {formatTimeAgo(promotion.createdAt)}
              </span>
            </div>
            
            <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
              {promotion.title}
            </h3>
            
            <div className="flex flex-col gap-1 mb-2">
              {promotion.price_from && (
                <span className="text-sm text-gray-500 line-through">
                  {promotion.price_from.startsWith('R$') ? promotion.price_from : `R$ ${promotion.price_from}`}
                </span>
              )}
              <span className="text-lg font-bold text-orange-500">
                {promotion.price.startsWith('R$') ? promotion.price : `R$ ${promotion.price}`}
              </span>
            </div>
            
            {/* Container com altura fixa para cupom */}
            <div className="h-6 mb-2">
              {promotion.coupon && promotion.coupon.trim() !== '' && promotion.coupon.toLowerCase() !== 'nan' && (
                <div 
                  className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded cursor-pointer hover:bg-orange-200 transition-colors select-none inline-block"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(promotion.coupon || '');
                    // Feedback visual temporário
                    const element = e.currentTarget;
                    const originalText = element.innerHTML;
                    element.innerHTML = '✅ Cupom copiado!';
                    element.classList.add('bg-green-100', 'text-green-800');
                    element.classList.remove('bg-orange-100', 'text-orange-800');
                    setTimeout(() => {
                      element.innerHTML = originalText;
                      element.classList.remove('bg-green-100', 'text-green-800');  
                      element.classList.add('bg-orange-100', 'text-orange-800');
                    }, 1500);
                  }}
                  title="Clique para copiar o cupom"
                >
                  Cupom: {promotion.coupon}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      {/* Button for direct affiliate link - sempre na parte inferior */}
      <div className="px-4 pb-4 mt-auto">
        <a
          href={promotion.affiliateLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-2 px-3 rounded-lg font-medium text-sm transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          Pegar Promoção
        </a>
      </div>
    </div>
  );
}