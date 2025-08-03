import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface OptimizedImage {
  webpUrl: string;
  originalUrl: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Converte e otimiza uma imagem para WebP
 * Ideal para previews do WhatsApp
 */
export async function convertToWebP(
  imageUrl: string,
  shortId: string
): Promise<OptimizedImage | null> {
  try {
    console.log('Convertendo imagem para WebP:', imageUrl);

    // Fazer download da imagem
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao baixar imagem: ${response.status}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Criar diretório se não existir
    const uploadsDir = path.join(process.cwd(), 'public', 'images', 'products');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Processar imagem com Sharp
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Configurações otimizadas para WhatsApp (seguindo melhores práticas)
    const targetWidth = 1200;
    const targetHeight = 630;
    const maxFileSize = 300 * 1024; // 300KB

    // Redimensionar para formato WhatsApp (1.91:1) e converter para JPEG (melhor compatibilidade)
    let processedImage = image
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true
      });

    let jpegBuffer = await processedImage.toBuffer();

    // Se ainda estiver muito grande, reduzir qualidade
    if (jpegBuffer.length > maxFileSize) {
      console.log('Imagem muito grande, reduzindo qualidade...');
      processedImage = image
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({
          quality: 70,
          progressive: true,
          mozjpeg: true
        });
      jpegBuffer = await processedImage.toBuffer();
    }

    // Se ainda estiver grande, reduzir dimensões mantendo proporção WhatsApp
    if (jpegBuffer.length > maxFileSize) {
      console.log('Reduzindo dimensões da imagem...');
      processedImage = image
        .resize(800, 420, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({
          quality: 75,
          progressive: true,
          mozjpeg: true
        });
      jpegBuffer = await processedImage.toBuffer();
    }

    // Salvar arquivo
    const filename = `${shortId}.jpg`;
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, jpegBuffer);

    const jpegUrl = `/images/products/${filename}`;

    console.log(`Imagem convertida: ${jpegUrl} (${Math.round(jpegBuffer.length / 1024)}KB)`);

    // Obter dimensões reais da imagem processada
    const finalMetadata = await sharp(jpegBuffer).metadata();
    
    return {
      webpUrl: jpegUrl,
      originalUrl: imageUrl,
      width: finalMetadata.width || targetWidth,
      height: finalMetadata.height || targetHeight,
      size: jpegBuffer.length
    };

  } catch (error) {
    console.error('Erro ao converter imagem para JPEG:', error);
    return null;
  }
}

/**
 * Cria versão quadrada para WhatsApp
 */
export async function createSquareVersion(
  imageUrl: string,
  shortId: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao baixar imagem: ${response.status}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Criar versão quadrada 400x400
    const squareImage = sharp(imageBuffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .webp({
        quality: 80,
        effort: 6
      });

    const squareBuffer = await squareImage.toBuffer();

    // Salvar versão quadrada
    const uploadsDir = path.join(process.cwd(), 'public', 'images', 'products');
    const squareFilename = `${shortId}_square.webp`;
    const squareFilePath = path.join(uploadsDir, squareFilename);
    await writeFile(squareFilePath, squareBuffer);

    return `/images/products/${squareFilename}`;

  } catch (error) {
    console.error('Erro ao criar versão quadrada:', error);
    return null;
  }
}

/**
 * Valida se a imagem está otimizada para WhatsApp
 */
export function validateImageForWhatsApp(image: OptimizedImage): boolean {
  const maxSize = 300 * 1024; // 300KB
  const minWidth = 300;
  const aspectRatio = image.width / image.height;

  return (
    image.size <= maxSize &&
    image.width >= minWidth &&
    aspectRatio <= 4 // WhatsApp recomenda proporção máxima de 4:1
  );
}

/**
 * Otimiza URL de imagem para WhatsApp usando proxy interno
 */
export async function optimizeImageUrlForWhatsApp(imageUrl: string): Promise<string> {
  // Se já é do nosso domínio, retorna como está
  if (imageUrl.includes('fareja.ai') || imageUrl.includes('localhost')) {
    return imageUrl;
  }

  // Usa nosso proxy de imagem para imagens externas
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fareja.ai';
  const encodedUrl = encodeURIComponent(imageUrl);
  return `${baseUrl}/api/image-proxy?url=${encodedUrl}`;
}

/**
 * Pré-aquece cache de imagem para WhatsApp
 */
export async function prewarmImageCache(imageUrl: string): Promise<boolean> {
  try {
    const optimizedUrl = await optimizeImageUrlForWhatsApp(imageUrl);
    
    // Pré-busca a imagem para garantir que está em cache
    const response = await fetch(optimizedUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatsApp)',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Falha ao pré-aquecer cache de imagem:', error);
    return false;
  }
}