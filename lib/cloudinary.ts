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

    // Construir URL com transformações
    // Para página do produto: imagem quadrada que não corta
    const transformedUrl = cloudinary.url(result.public_id, {
      transformation: [
        {
          width: 800,
          height: 800,
          crop: 'pad',  // 'pad' adiciona padding ao invés de cortar
          background: 'white',
          gravity: 'center',
          quality: 'auto:good',
          format: 'jpg',
        }
      ],
      secure: true,
    });

    console.log(`✅ Upload successful: ${transformedUrl}`);

    return {
      success: true,
      url: transformedUrl,  // Retornar URL transformada
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

  // Construir transformação inline na URL
  const width = options?.width || 800;
  const height = options?.height || 800;
  const crop = options?.crop || 'pad';
  const format = options?.format || 'jpg';
  
  // Inserir transformações antes do /v{version}/ na URL
  const transformations = `c_${crop},w_${width},h_${height},b_white,g_center,q_auto:good,f_${format}`;
  
  // Substituir /upload/ por /upload/{transformações}/
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Gera URL otimizada para WhatsApp (1200x630)
 */
export function getCloudinaryWhatsAppUrl(url: string): string {
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  // Transformações específicas para WhatsApp
  const transformations = 'c_pad,w_1200,h_630,b_white,g_center,q_auto:good,f_jpg';
  
  // Substituir /upload/ por /upload/{transformações}/
  return url.replace('/upload/', `/upload/${transformations}/`);
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