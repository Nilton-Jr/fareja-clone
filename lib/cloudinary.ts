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

    // Upload com transformações para WhatsApp
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: `produtos/${shortId}`,
      folder: 'fareja',
      resource_type: 'image',
      // Transformações para otimizar para WhatsApp
      transformation: [
        {
          width: 1200,
          height: 630,
          crop: 'fill',
          gravity: 'center',
          quality: 'auto:good',
          format: 'jpg',
        }
      ],
      // Tags para organização
      tags: ['produto', 'whatsapp'],
    });

    console.log(`✅ Upload successful: ${result.secure_url}`);

    return {
      success: true,
      url: result.secure_url,
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