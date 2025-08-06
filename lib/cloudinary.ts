import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  publicId: string;
  error?: string;
}

/**
 * Upload de imagem para Cloudinary otimizada para WhatsApp
 */
export async function uploadToCloudinary(
  imageUrl: string,
  shortId: string
): Promise<CloudinaryUploadResult> {
  try {
    console.log(`☁️ Uploading to Cloudinary: ${shortId}`);

    // Upload simples sem transformações (vamos aplicar na URL)
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: `produtos/${shortId}`,
      folder: 'fareja',
      resource_type: 'image',
      // Tags para organização
      tags: ['produto', 'whatsapp'],
    });

    // Construir URL simples sem transformações (serão aplicadas via Next.js Image ou dinamicamente)
    const baseUrl = cloudinary.url(result.public_id, {
      secure: true,
      transformation: [] // Sem transformações na URL base
    });

    console.log(`✅ Upload successful: ${baseUrl}`);

    return {
      success: true,
      url: baseUrl,  // Retornar URL base limpa
      publicId: result.public_id,
    };

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    return {
      success: false,
      url: '',
      publicId: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

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

/**
 * Upload batch de imagens (para migração)
 */
export async function uploadBatchToCloudinary(
  images: Array<{ url: string; shortId: string }>
): Promise<Array<CloudinaryUploadResult>> {
  const results: CloudinaryUploadResult[] = [];
  
  // Processar em lotes de 5 para não sobrecarregar
  const batchSize = 5;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    
    const batchPromises = batch.map(img => 
      uploadToCloudinary(img.url, img.shortId)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pequeno delay entre lotes
    if (i + batchSize < images.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}