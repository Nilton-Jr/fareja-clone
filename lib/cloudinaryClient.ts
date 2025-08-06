/**
 * Client-safe Cloudinary URL functions
 * These functions only manipulate URLs and don't import the server-side cloudinary package
 */

/**
 * Gera URL do Cloudinary com transformações específicas
 */
export function getCloudinaryUrl(url: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
  format?: string;
}): string {
  // Se não for URL do Cloudinary, retornar como está
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  // Se a URL já contém transformações, não adicionar mais
  if (url.includes('/upload/c_') || url.includes('/upload/w_') || url.match(/\/upload\/[^\/]*c_/)) {
    console.log('🔄 URL already has transformations, returning as-is:', url);
    return url;
  }

  // Construir transformação inline na URL
  const width = options?.width || 800;
  const height = options?.height || 800;
  const crop = options?.crop || 'pad';
  const format = options?.format || 'jpg';
  
  // Inserir transformações antes do /v{version}/ na URL
  const transformations = `c_${crop},w_${width},h_${height},b_white,g_center,q_auto:good,f_${format}`;
  
  // Substituir /upload/ por /upload/{transformações}/
  const transformedUrl = url.replace('/upload/', `/upload/${transformations}/`);
  console.log('🎨 Added transformations to Cloudinary URL:', transformedUrl);
  
  return transformedUrl;
}

/**
 * Gera URL otimizada para WhatsApp (1200x630)
 */
export function getCloudinaryWhatsAppUrl(url: string): string {
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  // Se a URL já contém transformações, não adicionar mais
  if (url.includes('/upload/c_') || url.includes('/upload/w_') || url.match(/\/upload\/[^\/]*c_/)) {
    console.log('🔄 WhatsApp URL already has transformations, returning as-is:', url);
    return url;
  }

  // Transformações específicas para WhatsApp
  const transformations = 'c_pad,w_1200,h_630,b_white,g_center,q_auto:good,f_jpg';
  
  // Substituir /upload/ por /upload/{transformações}/
  const transformedUrl = url.replace('/upload/', `/upload/${transformations}/`);
  console.log('📱 Added WhatsApp transformations to Cloudinary URL:', transformedUrl);
  
  return transformedUrl;
}