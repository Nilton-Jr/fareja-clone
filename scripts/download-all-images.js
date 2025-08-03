const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

// Função para download com retry
async function downloadImageWithRetry(url, filePath, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`  Tentativa ${i + 1}/${maxRetries}...`);
      
      const protocol = url.startsWith('https') ? https : http;
      
      return new Promise((resolve, reject) => {
        const file = require('fs').createWriteStream(filePath);
        
        const request = protocol.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*',
          }
        }, (response) => {
          if (response.statusCode !== 200) {
            file.close();
            fs.unlink(filePath).catch(() => {});
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }
          
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            resolve(true);
          });
        });
        
        request.on('error', (err) => {
          file.close();
          fs.unlink(filePath).catch(() => {});
          reject(err);
        });
        
        request.setTimeout(30000, () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
      });
      
    } catch (error) {
      console.log(`  Erro: ${error.message}`);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
    }
  }
}

async function main() {
  console.log('🚀 DOWNLOAD DE TODAS AS IMAGENS PARA ASSETS LOCAIS');
  console.log('================================================\n');
  
  try {
    // Criar diretório
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');
    await fs.mkdir(imagesDir, { recursive: true });
    console.log(`✅ Diretório criado: ${imagesDir}\n`);
    
    // Buscar TODAS as promoções com imagens externas
    const promotions = await prisma.promotion.findMany({
      where: {
        imageUrl: {
          startsWith: 'http'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total de promoções encontradas: ${promotions.length}\n`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    
    for (let i = 0; i < promotions.length; i++) {
      const promo = promotions[i];
      console.log(`[${i + 1}/${promotions.length}] Processando: ${promo.shortId}`);
      
      try {
        // Determinar extensão
        let extension = 'jpg';
        const urlLower = promo.imageUrl.toLowerCase();
        if (urlLower.includes('.webp')) extension = 'webp';
        else if (urlLower.includes('.png')) extension = 'png';
        else if (urlLower.includes('.gif')) extension = 'gif';
        
        const filename = `${promo.shortId}.${extension}`;
        const filePath = path.join(imagesDir, filename);
        const localUrl = `/images/products/${filename}`;
        
        // Verificar se já existe
        try {
          await fs.access(filePath);
          console.log(`  ⏭️  Já existe, pulando...`);
          
          // Atualizar URL no banco se necessário
          if (promo.imageUrl !== localUrl) {
            await prisma.promotion.update({
              where: { id: promo.id },
              data: { imageUrl: localUrl }
            });
            console.log(`  ✅ URL atualizada no banco`);
          }
          
          skipped++;
          continue;
        } catch {
          // Arquivo não existe, fazer download
        }
        
        console.log(`  📥 Baixando de: ${promo.imageUrl}`);
        
        // Download com retry
        await downloadImageWithRetry(promo.imageUrl, filePath);
        
        // Verificar tamanho do arquivo
        const stats = await fs.stat(filePath);
        console.log(`  ✅ Download concluído: ${Math.round(stats.size / 1024)}KB`);
        
        // Atualizar banco de dados
        await prisma.promotion.update({
          where: { id: promo.id },
          data: { imageUrl: localUrl }
        });
        
        console.log(`  ✅ Banco atualizado: ${localUrl}\n`);
        success++;
        
        // Pequeno delay para não sobrecarregar
        if (i < promotions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.log(`  ❌ ERRO: ${error.message}\n`);
        failed++;
      }
    }
    
    console.log('\n================================================');
    console.log('📊 RESUMO FINAL:');
    console.log(`✅ Sucesso: ${success}`);
    console.log(`⏭️  Pulados: ${skipped}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`📁 Total de imagens locais: ${success + skipped}`);
    console.log('================================================\n');
    
    if (failed > 0) {
      console.log('⚠️  Algumas imagens falharam. Execute novamente para tentar baixá-las.');
    }
    
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Faça commit das imagens em /public/images/products');
    console.log('2. Deploy no Vercel');
    console.log('3. Teste o WhatsApp preview com as novas URLs locais');
    
  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main().catch(console.error);