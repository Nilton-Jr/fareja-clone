'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductHeader() {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      // Redirecionar para página inicial com busca
      router.push(`/?search=${encodeURIComponent(term.trim())}`);
    }
  };

  return (
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
            {/* WhatsApp call - visible on mobile */}
            <a
              href="https://chat.whatsapp.com/EIrN3j3ndMH6SV3pCWDfJz"
              target="_blank"
              rel="noopener noreferrer"
              className="md:hidden flex items-center bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
            >
              📱 VIP
            </a>
            
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
  );
}