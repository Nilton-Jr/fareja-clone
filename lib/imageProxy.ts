/**
 * Cria URLs proxy para imagens externas usando Next.js Image Optimization
 * Isso faz as imagens parecerem "locais" para meta tags
 */

export function getProxiedImageUrl(originalUrl: string, width: number = 1200, quality: number = 85): string {
  // Se já for uma URL do nosso proxy, retornar como está
  if (originalUrl.startsWith('/_next/image')) {
    return originalUrl;
  }
  
  // Codificar URL original
  const encodedUrl = encodeURIComponent(originalUrl);
  
  // Retornar URL do proxy Next.js
  return `/_next/image?url=${encodedUrl}&w=${width}&q=${quality}`;
}

/**
 * Cria URL otimizada para WhatsApp/OG tags
 */
export function getWhatsAppOptimizedUrl(imageUrl: string, baseUrl: string = ''): string {
  // Se for URL do Cloudinary, usar diretamente (já otimizado)
  if (imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }
  
  // Para outras URLs (Amazon, etc), usar proxy
  const proxiedUrl = getProxiedImageUrl(imageUrl, 1200, 85);
  
  // Se baseUrl fornecida, retornar URL absoluta
  if (baseUrl) {
    return `${baseUrl}${proxiedUrl}`;
  }
  
  return proxiedUrl;
}

/**
 * Verifica se URL precisa de proxy
 */
export function needsProxy(url: string): boolean {
  // URLs que NÃO precisam de proxy
  const noProxyPatterns = [
    'cloudinary.com',
    '/_next/image',
    '/images/',
    'data:image'
  ];
  
  return !noProxyPatterns.some(pattern => url.includes(pattern));
}