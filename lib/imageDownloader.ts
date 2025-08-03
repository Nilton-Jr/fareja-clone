import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
// Sharp import with fallback for Vercel serverless environment
let sharp: any;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp not available in this environment:', error);
  sharp = null;
}

export interface OptimizedImageResult {
  success: boolean;
  localUrl: string;
  originalUrl: string;
  fileSize: number;
  error?: string;
}

/**
 * Baixa e otimiza imagem para WhatsApp, salvando em /public/images/products/
 */
export async function downloadAndOptimizeForWhatsApp(
  imageUrl: string,
  shortId: string
): Promise<OptimizedImageResult> {
  try {
    console.log(`📥 Baixando imagem para ${shortId}: ${imageUrl}`);

    // Check if Sharp is available
    if (!sharp) {
      console.warn('Sharp not available, returning original URL');
      return {
        success: false,
        localUrl: '',
        originalUrl: imageUrl,
        fileSize: 0,
        error: 'Sharp library not available in serverless environment'
      };
    }

    // Criar diretório se não existir (com tratamento para Vercel serverless)
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');
    try {
      if (!existsSync(imagesDir)) {
        await mkdir(imagesDir, { recursive: true });
        console.log(`📁 Diretório criado: ${imagesDir}`);
      }
    } catch (dirError) {
      console.error('Erro ao criar diretório no Vercel:', dirError);
      return {
        success: false,
        localUrl: '',
        originalUrl: imageUrl,
        fileSize: 0,
        error: 'Cannot create directory in serverless environment'
      };
    }

    // Download da imagem original
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao baixar imagem: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`📦 Imagem baixada: ${Math.round(imageBuffer.length / 1024)}KB`);

    // Otimização para WhatsApp (seguindo melhores práticas)
    const optimizedImage = sharp(imageBuffer)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true
      });

    let finalBuffer = await optimizedImage.toBuffer();

    // Se ainda estiver muito grande, reduzir qualidade
    if (finalBuffer.length > 300 * 1024) { // 300KB
      console.log('🔄 Imagem muito grande, reduzindo qualidade...');
      finalBuffer = await sharp(imageBuffer)
        .resize(1200, 630, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({
          quality: 70,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
    }

    // Se ainda estiver grande, reduzir dimensões
    if (finalBuffer.length > 300 * 1024) {
      console.log('📏 Reduzindo dimensões...');
      finalBuffer = await sharp(imageBuffer)
        .resize(800, 420, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({
          quality: 75,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
    }

    // Salvar arquivo otimizado
    const filename = `${shortId}.jpg`;
    const filePath = path.join(imagesDir, filename);
    await writeFile(filePath, finalBuffer);

    const localUrl = `/images/products/${filename}`;

    console.log(`✅ Imagem otimizada salva: ${localUrl} (${Math.round(finalBuffer.length / 1024)}KB)`);

    return {
      success: true,
      localUrl,
      originalUrl: imageUrl,
      fileSize: finalBuffer.length
    };

  } catch (error) {
    console.error(`❌ Erro ao processar imagem para ${shortId}:`, error);
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
 * Gera múltiplas versões da imagem (opcional para casos especiais)
 */
export async function generateImageVariants(
  imageBuffer: Buffer,
  shortId: string
): Promise<{ [key: string]: string }> {
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');
  const variants: { [key: string]: string } = {};

  try {
    // Versão principal (WhatsApp otimizada)
    const mainImage = await sharp(imageBuffer)
      .resize(1200, 630, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    
    const mainPath = path.join(imagesDir, `${shortId}.jpg`);
    await writeFile(mainPath, mainImage);
    variants.main = `/images/products/${shortId}.jpg`;

    // Versão quadrada (backup)
    const squareImage = await sharp(imageBuffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    const squarePath = path.join(imagesDir, `${shortId}_square.jpg`);
    await writeFile(squarePath, squareImage);
    variants.square = `/images/products/${shortId}_square.jpg`;

    return variants;
  } catch (error) {
    console.error('Erro ao gerar variantes da imagem:', error);
    return variants;
  }
}

/**
 * Valida se a imagem está otimizada para WhatsApp
 */
export function validateImageForWhatsApp(fileSize: number, width: number = 1200, height: number = 630): boolean {
  const maxSize = 300 * 1024; // 300KB
  const correctAspectRatio = Math.abs((width / height) - (1200 / 630)) < 0.1;
  
  return fileSize <= maxSize && correctAspectRatio && width >= 300;
}