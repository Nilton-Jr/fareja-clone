const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

const prisma = new PrismaClient();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ds3bntpck',
  api_key: process.env.CLOUDINARY_API_KEY || '553234253863815',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'QXCaHgwwTdMC0occkeKRSxHyWFs',
});

async function uploadToCloudinary(imageUrl, shortId) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: `produtos/${shortId}`,
      folder: 'fareja',
      resource_type: 'image',
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
      tags: ['produto', 'whatsapp', 'migration'],
    });
    
    return {
      success: true,
      url: result.secure_url,
    };
  } catch (error) {
    console.error(`Error uploading ${shortId}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🚀 MIGRAÇÃO PARA CLOUDINARY');
  console.log('===========================\n');
  
  try {
    // Buscar promoções com imagens externas (não Cloudinary)
    const promotions = await prisma.promotion.findMany({
      where: {
        AND: [
          { imageUrl: { startsWith: 'http' } },
          { NOT: { imageUrl: { contains: 'cloudinary.com' } } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Processar 100 por vez
    });
    
    console.log(`📊 Encontradas ${promotions.length} promoções para migrar\n`);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < promotions.length; i++) {
      const promo = promotions[i];
      console.log(`[${i + 1}/${promotions.length}] Processando: ${promo.shortId}`);
      console.log(`  Original: ${promo.imageUrl.substring(0, 50)}...`);
      
      const result = await uploadToCloudinary(promo.imageUrl, promo.shortId);
      
      if (result.success) {
        // Atualizar no banco
        await prisma.promotion.update({
          where: { id: promo.id },
          data: { imageUrl: result.url }
        });
        
        console.log(`  ✅ Migrado para: ${result.url.substring(0, 60)}...\n`);
        success++;
      } else {
        console.log(`  ❌ Falha: ${result.error}\n`);
        failed++;
      }
      
      // Delay para não sobrecarregar
      if (i < promotions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s entre uploads
      }
    }
    
    console.log('\n===========================');
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log(`✅ Sucesso: ${success}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log('===========================\n');
    
    if (success > 0) {
      console.log('🎉 Migração concluída com sucesso!');
      console.log('As imagens agora estão no Cloudinary CDN.');
    }
    
  } catch (error) {
    console.error('Erro fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main().catch(console.error);