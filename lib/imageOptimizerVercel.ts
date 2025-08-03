/**
 * Otimizador de imagens para Vercel com Next.js Image Optimization
 * Como o filesystem é read-only em serverless, usamos a API de otimização do próprio Vercel
 */

export interface OptimizedImageResult {
  success: boolean;
  localUrl: string;
  originalUrl: string;
  fileSize: number;
  error?: string;
}

/**
 * Otimiza imagem usando o Next.js Image Optimization API do Vercel
 * Cria uma URL otimizada que será processada pelo Vercel em runtime
 */
export async function optimizeImageForWhatsApp(
  imageUrl: string,
  shortId: string
): Promise<OptimizedImageResult> {
  try {
    console.log(`🔧 Otimizando imagem para ${shortId}: ${imageUrl}`);

    // Encode da URL para usar com Next.js Image Optimization
    const encodedUrl = encodeURIComponent(imageUrl);
    
    // Criar URL otimizada usando Next.js Image Optimization
    // Vercel automaticamente otimiza: width=1200, height=630, quality=85, format=webp
    const optimizedUrl = `/_next/image?url=${encodedUrl}&w=1200&q=85`;
    
    console.log(`✅ URL otimizada criada: ${optimizedUrl}`);

    return {
      success: true,
      localUrl: optimizedUrl,
      originalUrl: imageUrl,
      fileSize: 0, // Não conhecemos o tamanho até ser processado
    };

  } catch (error) {
    console.error(`❌ Erro ao otimizar imagem para ${shortId}:`, error);
    return {
      success: false,
      localUrl: '',
      originalUrl: imageUrl,
      fileSize: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Cria múltiplas URLs otimizadas para diferentes casos de uso
 */
export function generateOptimizedImageUrls(imageUrl: string): {
  whatsapp: string;
  thumbnail: string;
  original: string;
} {
  const encodedUrl = encodeURIComponent(imageUrl);
  
  return {
    // WhatsApp: 1200x630, quality 85, WebP
    whatsapp: `/_next/image?url=${encodedUrl}&w=1200&q=85`,
    // Thumbnail: 400x400, quality 75
    thumbnail: `/_next/image?url=${encodedUrl}&w=400&q=75`,
    // Original mantém proporção, quality 90
    original: `/_next/image?url=${encodedUrl}&w=1920&q=90`
  };
}

/**
 * Valida se a URL da imagem é compatível com Next.js Image Optimization
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Lista de domínios permitidos (adicionar conforme necessário)
    const allowedDomains = [
      'http2.mlstatic.com',
      'm.media-amazon.com',
      'images-na.ssl-images-amazon.com',
      'shopee.com.br',
      'cf.shopee.com.br'
    ];
    
    return allowedDomains.some(domain => parsedUrl.hostname.includes(domain));
  } catch {
    return false;
  }
}