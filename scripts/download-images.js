const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const publicDir = path.join(process.cwd(), 'public', 'images', 'products');
    
    // Criar diretório se não existir
    await fs.mkdir(publicDir, { recursive: true });
    
    // Salvar arquivo
    await fs.writeFile(path.join(publicDir, filename), Buffer.from(buffer));
    
    return true;
  } catch (error) {
    console.error(`Failed to download ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting image download process...');
  
  try {
    // Buscar últimas 50 promoções
    const promotions = await prisma.promotion.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      where: {
        imageUrl: {
          startsWith: 'http'
        }
      }
    });
    
    console.log(`Found ${promotions.length} promotions to process`);
    
    let downloaded = 0;
    let failed = 0;
    
    for (const promo of promotions) {
      // Determinar extensão
      let extension = 'jpg';
      if (promo.imageUrl.includes('.webp')) extension = 'webp';
      else if (promo.imageUrl.includes('.png')) extension = 'png';
      
      const filename = `${promo.shortId}.${extension}`;
      const localPath = `/images/products/${filename}`;
      
      // Verificar se já existe
      const filePath = path.join(process.cwd(), 'public', 'images', 'products', filename);
      try {
        await fs.access(filePath);
        console.log(`✓ ${promo.shortId} - Already exists`);
        continue;
      } catch {
        // Arquivo não existe, fazer download
      }
      
      console.log(`📥 Downloading ${promo.shortId}...`);
      const success = await downloadImage(promo.imageUrl, filename);
      
      if (success) {
        // Atualizar banco de dados
        await prisma.promotion.update({
          where: { id: promo.id },
          data: { imageUrl: localPath }
        });
        downloaded++;
        console.log(`✅ ${promo.shortId} - Downloaded and updated`);
      } else {
        failed++;
      }
      
      // Delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Process completed!`);
    console.log(`Downloaded: ${downloaded}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped (already exists): ${promotions.length - downloaded - failed}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();