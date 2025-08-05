'use client';

import { useEffect } from 'react';

/**
 * Componente para verificar e alertar sobre o tamanho do head HTML
 * O WhatsApp só processa os primeiros 300KB do HTML para encontrar tags OG
 */
export default function OptimizedHead() {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Verificar tamanho do head em desenvolvimento
      const checkHeadSize = () => {
        const headElement = document.head;
        const headHTML = headElement.innerHTML;
        const headSize = new Blob([headHTML]).size;
        const headSizeKB = (headSize / 1024).toFixed(2);
        
        // Encontrar posição das meta tags OG
        const ogTagMatch = headHTML.search(/<meta\s+property="og:/i);
        const ogTagPosition = ogTagMatch !== -1 ? ogTagMatch : -1;
        const ogTagPositionKB = ogTagPosition !== -1 
          ? (new Blob([headHTML.substring(0, ogTagPosition)]).size / 1024).toFixed(2)
          : 'N/A';
        
        console.group('🔍 WhatsApp OG Tags Audit');
        console.log(`📏 Total head size: ${headSizeKB}KB`);
        console.log(`📍 OG tags start at: ${ogTagPositionKB}KB`);
        
        if (parseFloat(headSizeKB) > 300) {
          console.error('❌ WARNING: Head size exceeds 300KB! WhatsApp may not find OG tags.');
        } else if (ogTagPosition > 300 * 1024) {
          console.error('❌ WARNING: OG tags are beyond 300KB mark!');
        } else {
          console.log('✅ Head size is within WhatsApp limits');
        }
        
        // Verificar presença de CSS inline volumoso
        const styleElements = headElement.querySelectorAll('style');
        let totalInlineCSS = 0;
        styleElements.forEach((style) => {
          totalInlineCSS += new Blob([style.innerHTML]).size;
        });
        const inlineCSSKB = (totalInlineCSS / 1024).toFixed(2);
        
        if (totalInlineCSS > 50 * 1024) {
          console.warn(`⚠️ Large inline CSS detected: ${inlineCSSKB}KB. Consider moving to external files.`);
        }
        
        console.groupEnd();
      };
      
      // Verificar após o carregamento completo
      if (document.readyState === 'complete') {
        checkHeadSize();
      } else {
        window.addEventListener('load', checkHeadSize);
      }
    }
  }, []);
  
  return null;
}