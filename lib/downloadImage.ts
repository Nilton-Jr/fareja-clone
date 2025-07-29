import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Download simples de imagem sem otimização (para evitar problemas com Sharp no Vercel)
 */
export async function downloadImageToPublic(
  imageUrl: string,
  shortId: string
): Promise<{ success: boolean; localPath: string; error?: string }> {
  try {
    console.log(`📥 Downloading image for ${shortId}: ${imageUrl}`);

    // Download da imagem
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Determinar extensão baseada no content-type
    let extension = 'jpg';
    if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('gif')) extension = 'gif';

    // Criar nome do arquivo
    const filename = `${shortId}.${extension}`;
    const localPath = `/images/products/${filename}`;

    console.log(`✅ Image downloaded: ${Math.round(buffer.byteLength / 1024)}KB, saving as ${filename}`);

    return {
      success: true,
      localPath,
    };

  } catch (error) {
    console.error(`❌ Error downloading image for ${shortId}:`, error);
    return {
      success: false,
      localPath: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}