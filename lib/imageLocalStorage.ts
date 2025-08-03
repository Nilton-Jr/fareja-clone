import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const PUBLIC_IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'products');

// Garantir que o diretório existe
if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
  fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
}

// Gerar nome único para a imagem baseado no conteúdo
function generateImageName(buffer: Buffer, extension: string): string {
  const hash = crypto.createHash('md5').update(buffer).digest('hex');
  return `${hash.substring(0, 8)}.${extension}`;
}

// Fazer download da imagem
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Otimizar imagem para WhatsApp
async function optimizeImageForWhatsApp(buffer: Buffer): Promise<Buffer> {
  // WhatsApp recomenda 1200x630 para melhor preview
  // Mas vamos criar múltiplas versões para diferentes usos
  
  const optimized = await sharp(buffer)
    .resize(1200, 630, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .jpeg({
      quality: 85,
      progressive: true,
      optimizeScans: true
    })
    .toBuffer();
    
  return optimized;
}

// Salvar imagem localmente
export async function saveImageLocally(imageUrl: string): Promise<string> {
  try {
    // Se já é uma imagem local, retornar
    if (imageUrl.startsWith('/images/')) {
      return imageUrl;
    }
    
    // Download da imagem
    const buffer = await downloadImage(imageUrl);
    
    // Otimizar para WhatsApp
    const optimizedBuffer = await optimizeImageForWhatsApp(buffer);
    
    // Gerar nome do arquivo
    const fileName = generateImageName(optimizedBuffer, 'jpg');
    const filePath = path.join(PUBLIC_IMAGES_DIR, fileName);
    
    // Verificar se já existe
    if (!fs.existsSync(filePath)) {
      // Salvar arquivo otimizado
      fs.writeFileSync(filePath, optimizedBuffer);
      
      // Também salvar versão WebP para performance do site
      const webpBuffer = await sharp(buffer)
        .resize(600, 600, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 85 })
        .toBuffer();
        
      const webpFileName = generateImageName(webpBuffer, 'webp');
      const webpFilePath = path.join(PUBLIC_IMAGES_DIR, webpFileName);
      fs.writeFileSync(webpFilePath, webpBuffer);
    }
    
    // Retornar caminho relativo para uso no site
    return `/images/products/${fileName}`;
    
  } catch (error) {
    console.error('Error saving image locally:', error);
    // Em caso de erro, retornar URL original
    return imageUrl;
  }
}

// Limpar imagens antigas (opcional - para manutenção)
export async function cleanOldImages(daysToKeep: number = 30): Promise<void> {
  const files = fs.readdirSync(PUBLIC_IMAGES_DIR);
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
  
  for (const file of files) {
    const filePath = path.join(PUBLIC_IMAGES_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old image: ${file}`);
    }
  }
}