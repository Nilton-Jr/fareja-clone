import { convertToWebP } from './imageOptimizer';

// Imagem padrão usando data URL (não precisa de internet)
const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzYTc1YyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHV0bzwvdGV4dD4KICA8L3N2Zz4=';

export async function scrapeProductImage(productUrl: string, shortId?: string): Promise<string> {
  console.log('Tentando fazer scraping de:', productUrl);
  
  try {
    // Tentar usar fetch simples para pegar o HTML
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 segundos timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Procurar por padrões específicos da Amazon
    if (productUrl.includes('amazon') || productUrl.includes('amzn')) {
      // Procurar por data-a-dynamic-image
      const dynamicImageMatch = html.match(/data-a-dynamic-image="([^"]+)"/);
      if (dynamicImageMatch) {
        try {
          const decoded = dynamicImageMatch[1].replace(/&quot;/g, '"');
          const imagesObj = JSON.parse(decoded);
          const urls = Object.keys(imagesObj);
          if (urls.length > 0) {
            console.log('Imagem Amazon encontrada:', urls[0]);
            const finalImageUrl = await optimizeImageForWhatsApp(urls[0], shortId);
            return finalImageUrl;
          }
        } catch (e) {
          console.log('Erro ao parsear data-a-dynamic-image');
        }
      }
      
      // Fallback: procurar por id="landingImage"
      const landingImageMatch = html.match(/<img[^>]+id="landingImage"[^>]+src="([^"]+)"/);
      if (landingImageMatch) {
        console.log('Landing image encontrada:', landingImageMatch[1]);
        const finalImageUrl = await optimizeImageForWhatsApp(landingImageMatch[1], shortId);
        return finalImageUrl;
      }
    }
    
    // Procurar por padrões específicos do Mercado Livre
    if (productUrl.includes('mercadolivre.com') || productUrl.includes('mercadolibre.com') || productUrl.includes('mlstatic.com')) {
      console.log('Detectado produto do Mercado Livre');
      
      // Método 1: Procurar pela imagem principal com classe ui-pdp-image
      const mainImageMatch = html.match(/<img[^>]+class="[^"]*ui-pdp-image[^"]*"[^>]+src="([^"]+)"/);
      if (mainImageMatch) {
        console.log('Imagem principal ML encontrada:', mainImageMatch[1]);
        const finalImageUrl = await optimizeImageForWhatsApp(mainImageMatch[1], shortId);
        return finalImageUrl;
      }
      
      // Método 2: Procurar por data-zoom (imagem de alta qualidade)
      const zoomImageMatch = html.match(/data-zoom="([^"]+)"/);
      if (zoomImageMatch) {
        console.log('Imagem zoom ML encontrada:', zoomImageMatch[1]);
        const finalImageUrl = await optimizeImageForWhatsApp(zoomImageMatch[1], shortId);
        return finalImageUrl;
      }
      
      // Método 3: Procurar por imagens mlstatic.com diretamente
      const mlstaticMatches = html.match(/https?:\/\/[^"'\s]*mlstatic\.com[^"'\s]*\.(jpg|jpeg|png|webp)/gi);
      if (mlstaticMatches && mlstaticMatches.length > 0) {
        // Filtrar imagens que parecem ser do produto (não thumbnails muito pequenos)
        const productImages = mlstaticMatches.filter(url => 
          !url.includes('-S.') && // Não é thumbnail pequeno
          !url.includes('-T.') && // Não é thumbnail
          (url.includes('-O.') || url.includes('-F.') || url.includes('-V.')) // Imagem original/full/variant
        );
        
        if (productImages.length > 0) {
          console.log('Imagem mlstatic encontrada:', productImages[0]);
          const finalImageUrl = await optimizeImageForWhatsApp(productImages[0], shortId);
          return finalImageUrl;
        }
      }
      
      // Método 4: Procurar no JSON do produto (window.__PRELOADED_STATE__ ou similar)
      const jsonStateMatch = html.match(/__PRELOADED_STATE__\s*=\s*({.+?});/);
      if (jsonStateMatch) {
        try {
          const state = JSON.parse(jsonStateMatch[1]);
          // Tentar extrair URL da imagem do estado da página
          if (state.item && state.item.pictures && state.item.pictures.length > 0) {
            const pictureUrl = state.item.pictures[0].secure_url || state.item.pictures[0].url;
            if (pictureUrl) {
              console.log('Imagem do estado ML encontrada:', pictureUrl);
              const finalImageUrl = await optimizeImageForWhatsApp(pictureUrl, shortId);
              return finalImageUrl;
            }
          }
        } catch (e) {
          console.log('Erro ao parsear estado da página ML');
        }
      }
    }
    
    // Fallback geral: procurar qualquer imagem grande
    const imgMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/g);
    if (imgMatches) {
      for (const imgMatch of imgMatches) {
        const srcMatch = imgMatch.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1].startsWith('http')) {
          // Priorizar imagens que parecem ser de produto
          if (srcMatch[1].includes('media') || 
              srcMatch[1].includes('image') || 
              srcMatch[1].includes('product') ||
              srcMatch[1].includes('mlstatic.com')) {
            console.log('Imagem de produto encontrada:', srcMatch[1]);
            const finalImageUrl = await optimizeImageForWhatsApp(srcMatch[1], shortId);
            return finalImageUrl;
          }
        }
      }
    }
    
    console.log('Nenhuma imagem adequada encontrada, usando padrão');
    return DEFAULT_IMAGE;
    
  } catch (error) {
    console.error('Erro no scraping:', error);
    console.log('Usando imagem padrão devido ao erro');
    return DEFAULT_IMAGE;
  }
}

/**
 * Otimiza imagem para WhatsApp se shortId for fornecido
 */
async function optimizeImageForWhatsApp(imageUrl: string, shortId?: string): Promise<string> {
  // Se não temos shortId, retorna a URL original
  if (!shortId) {
    return imageUrl;
  }

  try {
    // Tenta converter para WebP otimizado
    const optimizedImage = await convertToWebP(imageUrl, shortId);
    
    if (optimizedImage) {
      return optimizedImage.webpUrl;
    }
  } catch (error) {
    console.error('Erro ao otimizar imagem:', error);
  }

  // Fallback para imagem original
  return imageUrl;
}