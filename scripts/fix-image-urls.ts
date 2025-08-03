import { PrismaClient } from '@prisma/client';
import { normalizeImageUrl } from '../lib/urlNormalizer';

const prisma = new PrismaClient();

async function fixImageUrls() {
  console.log('🔧 Starting image URL fix...');
  
  try {
    // Buscar todas as promoções com URLs problemáticas
    const promotions = await prisma.promotion.findMany({
      where: {
        OR: [
          { imageUrl: { contains: 'localhost:3000' } },
          { imageUrl: { startsWith: 'http://localhost' } },
          { imageUrl: { startsWith: 'https://localhost' } }
        ]
      }
    });
    
    console.log(`Found ${promotions.length} promotions with localhost URLs`);
    
    // Atualizar cada promoção
    for (const promotion of promotions) {
      const normalizedUrl = normalizeImageUrl(promotion.imageUrl, '');
      
      console.log(`Updating ${promotion.shortId}:`);
      console.log(`  From: ${promotion.imageUrl}`);
      console.log(`  To: ${normalizedUrl}`);
      
      await prisma.promotion.update({
        where: { id: promotion.id },
        data: { imageUrl: normalizedUrl }
      });
    }
    
    console.log('✅ All image URLs fixed!');
    
    // Mostrar estatísticas
    const stats = await prisma.promotion.groupBy({
      by: ['imageUrl'],
      _count: true,
      where: {
        imageUrl: { contains: '/images/products/' }
      }
    });
    
    console.log('\n📊 Image URL Statistics:');
    stats.forEach(stat => {
      console.log(`  ${stat.imageUrl}: ${stat._count} promotions`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing image URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixImageUrls();
}