'use client';

import { useEffect, useState } from 'react';
import PromotionCard from '../components/PromotionCard';
import Link from 'next/link';
import Image from 'next/image';

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

export default function Home() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);

  const fetchPromotions = async (pageNum: number) => {
    try {
      let url = `/api/promotions?page=${pageNum}&limit=20`;
      if (selectedStore) {
        url += `&store=${encodeURIComponent(selectedStore)}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        setHasMore(false);
        if (pageNum === 1) {
          setPromotions([]);
        }
      } else {
        setPromotions(prev => pageNum === 1 ? data : [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      if (pageNum === 1) {
        setPromotions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions(1);
  }, [selectedStore, searchTerm]);

  const handleStoreFilter = (store: string) => {
    setSelectedStore(store);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  };



  const loadMore = () => {
    if (!loading && hasMore) {
      setLoading(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPromotions(nextPage);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#151E3E] text-white p-4 sticky top-0 z-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <button className="md:hidden p-2 hover:bg-white/10 rounded">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                  <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
                </svg>
              </button>
              
              <Link href="/" className="flex items-center relative verified-logo">
                <Image
                  src="/fareja-logo.png"
                  alt="Fareja.ai"
                  width={140}
                  height={52}
                  className="max-w-[140px] w-auto h-[52px]"
                />
              </Link>
              
              <nav className="hidden md:flex items-center space-x-6 ml-8">
                <Link href="/cupons" className="flex items-center text-sm font-medium hover:text-orange-300">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 576 512">
                    <path d="M64 64C28.7 64 0 92.7 0 128l0 64c0 8.8 7.4 15.7 15.7 18.6C34.5 217.1 48 235 48 256s-13.5 38.9-32.3 45.4C7.4 304.3 0 311.2 0 320l0 64c0 35.3 28.7 64 64 64l448 0c35.3 0 64-28.7 64-64l0-64c0-8.8-7.4-15.7-15.7-18.6C541.5 294.9 528 277 528 256s13.5-38.9 32.3-45.4c8.3-2.9 15.7-9.8 15.7-18.6l0-64c0-35.3-28.7-64-64-64L64 64zm64 112l0 160c0 8.8 7.2 16 16 16l288 0c8.8 0 16-7.2 16-16l0-160c0-8.8-7.2-16-16-16l-288 0c-8.8 0-16 7.2-16 16zM96 160c0-17.7 14.3-32 32-32l320 0c17.7 0 32 14.3 32 32l0 192c0 17.7-14.3 32-32 32l-320 0c-17.7 0-32-14.3-32-32l0-192z"/>
                  </svg>
                  Cupom
                </Link>
                <Link href="/" className="text-sm font-medium hover:text-orange-300">
                  Promoções do dia
                </Link>
                <a href="#" className="text-sm font-medium hover:text-orange-300">
                  Blog
                </a>
                <a href="#" className="text-sm font-medium hover:text-orange-300">
                  App
                </a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="flex items-center justify-center w-10 h-10 bg-gray-600 hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
                  <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                </svg>
              </button>
            </div>
          </div>
          
          {showSearch && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Buscar promoções..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full max-w-md px-4 py-2 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-300"
              />
            </div>
          )}
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1">
        <div className="mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Promoções em Destaque</h2>
          </div>
          
          {/* Filtros por loja */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleStoreFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStore === '' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Todas as lojas
            </button>
            {[
              { name: 'Amazon', count: '23 Cupons', logo: '/amazon-logo.png' },
              { name: 'Mercado Livre', count: '183 Cupons', logo: '/mercadolivre-logo.png' },
              { name: 'Magalu', count: '13 Cupons', logo: '/magalu-logo.png' },
              { name: 'AliExpress', count: '2 Cupons', logo: '/aliexpress-logo.png' },
              { name: 'Americanas', count: '5 Cupons', logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjRUQwMDAwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QTwvdGV4dD4KICA8L3N2Zz4=' },
              { name: 'Shopee', count: '10 Cupons', logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjRUU0RDJEIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UzwvdGV4dD4KICA8L3N2Zz4=' }
            ].map(store => (
              <button
                key={store.name}
                onClick={() => handleStoreFilter(store.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedStore === store.name 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={20}
                  height={20}
                  className="rounded-sm"
                />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{store.name}</span>
                  <small className="text-xs text-gray-500">({store.count})</small>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {(!Array.isArray(promotions) || promotions.length === 0) && !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhuma promoção encontrada.</p>
            <p className="text-gray-500 mt-2">Tente ajustar os filtros ou busca!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(promotions) && promotions.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-600">Carregando promoções...</p>
          </div>
        )}
          </div>
          
          {/* Sidebar com WhatsApp */}
          <div className="hidden lg:block w-80 sticky top-24 h-fit">
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <p className="text-sm text-gray-800 font-bold mb-2">Já está no meu grupo de promoções?</p>
              <p className="text-sm text-gray-600 mb-3">Receba no Whatsapp as melhores promoções e economize mais.</p>
              <a
                href="https://chat.whatsapp.com/EIrN3j3ndMH6SV3pCWDfJz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium w-full justify-center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                </svg>
                <span>Clique aqui para entrar</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#151E3E] text-white p-4 mt-12">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 Fareja. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
