/**
 * Normaliza URLs de imagens para uso correto em produção
 */
export function normalizeImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return '';
  
  // Corrigir URLs com localhost
  if (imageUrl.includes('localhost:3000')) {
    imageUrl = imageUrl.replace('http://localhost:3000', '');
    imageUrl = imageUrl.replace('https://localhost:3000', '');
  }
  
  // Se for caminho relativo local, retornar como está (será usado com baseUrl depois)
  if (imageUrl.startsWith('/images/')) {
    return imageUrl;
  }
  
  // Se for URL completa válida (não localhost), retornar
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Se for só o nome do arquivo, assumir que está em /images/products/
  if (!imageUrl.includes('/') && imageUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    return `/images/products/${imageUrl}`;
  }
  
  return imageUrl;
}

/**
 * Converte URL de imagem para URL absoluta completa
 */
export function getAbsoluteImageUrl(imageUrl: string, baseUrl: string): string {
  const normalized = normalizeImageUrl(imageUrl, baseUrl);
  
  // Se já for URL absoluta externa, retornar
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    // Forçar HTTPS
    return normalized.replace('http://', 'https://');
  }
  
  // Se for caminho relativo, adicionar baseUrl
  if (normalized.startsWith('/')) {
    return `${baseUrl}${normalized}`;
  }
  
  // Fallback
  return normalized;
}