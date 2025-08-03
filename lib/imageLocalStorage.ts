import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import sharp from 'sharp';

// Diretório para salvar imagens localmente
const PUBLIC_IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'products');

// Garantir que o diretório existe
if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
  fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
}

/**
 * Salva uma imagem localmente otimizada para WhatsApp
 * Segue as melhores práticas para preview no WhatsApp:
 * - Dimensões: 1200x630
 * - Formato: JPEG com qualidade otimizada
 * - Tamanho: < 300KB idealmente
 */
export async function saveImageLocally(imageUrl: string): Promise<string> {
  try {
    console.log('📥 [ImageLocalStorage] Iniciando salvamento local de:', imageUrl);
    
    // Timeout mais agressivo para Vercel
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 segundos
    
    // Download da imagem
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.error(`❌ [ImageLocalStorage] Erro HTTP: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    console.log(`✅ [ImageLocalStorage] Download concluído: ${buffer.byteLength} bytes`);
    
    // Otimizar com Sharp para WhatsApp
    console.log('🔧 [ImageLocalStorage] Otimizando imagem para WhatsApp...');
    const optimizedBuffer = await sharp(Buffer.from(buffer))
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer();
    
    console.log(`✅ [ImageLocalStorage] Imagem otimizada: ${optimizedBuffer.length} bytes`);
    
    // Gerar nome único baseado no conteúdo
    const hash = createHash('md5').update(optimizedBuffer).digest('hex');
    const fileName = `${hash.substring(0, 8)}.jpg`;
    const filePath = path.join(PUBLIC_IMAGES_DIR, fileName);
    
    // Verificar se já existe
    if (fs.existsSync(filePath)) {
      console.log('♻️  [ImageLocalStorage] Imagem já existe, reutilizando:', fileName);
      return `/images/products/${fileName}`;
    }
    
    // Salvar arquivo
    fs.writeFileSync(filePath, optimizedBuffer);
    console.log('💾 [ImageLocalStorage] Imagem salva:', filePath);
    
    // Gerar versão WebP para melhor performance (opcional)
    try {
      const webpBuffer = await sharp(optimizedBuffer)
        .webp({ quality: 85 })
        .toBuffer();
      
      const webpPath = filePath.replace('.jpg', '.webp');
      fs.writeFileSync(webpPath, webpBuffer);
      console.log('🎨 [ImageLocalStorage] Versão WebP criada');
    } catch (webpError) {
      console.warn('⚠️  [ImageLocalStorage] Erro ao criar WebP:', webpError);
      // Continuar sem WebP
    }
    
    // Retornar caminho relativo para uso no site
    return `/images/products/${fileName}`;
    
  } catch (error) {
    console.error('❌ [ImageLocalStorage] Erro completo:', error);
    
    // Log detalhado para debug no Vercel
    if (error instanceof Error) {
      console.error('📋 [ImageLocalStorage] Stack:', error.stack);
      console.error('📋 [ImageLocalStorage] Message:', error.message);
      
      if (error.name === 'AbortError') {
        console.error('⏱️  [ImageLocalStorage] Timeout ao baixar imagem');
      }
    }
    
    // Retornar URL original em caso de erro
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
    
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted old image: ${file}`);
    }
  }
}