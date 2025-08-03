const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== Checking database content ===\n');
    
    // Get all promotions
    const promotions = await prisma.promotion.findMany({
      select: {
        shortId: true,
        title: true,
        storeName: true,
        imageUrl: true,
        affiliateLink: true
      }
    });
    
    console.log(`Total promotions: ${promotions.length}\n`);
    
    // Group by store
    const storeGroups = {};
    promotions.forEach(p => {
      const store = p.storeName.toLowerCase();
      if (!storeGroups[store]) {
        storeGroups[store] = [];
      }
      storeGroups[store].push(p);
    });
    
    // Analyze each store
    Object.entries(storeGroups).forEach(([store, items]) => {
      console.log(`=== ${store.toUpperCase()} (${items.length} items) ===`);
      
      items.forEach(item => {
        console.log(`- ${item.title.substring(0, 50)}...`);
        console.log(`  Image: ${item.imageUrl}`);
        console.log(`  Link: ${item.affiliateLink}`);
        console.log(`  ShortId: ${item.shortId}`);
        console.log('');
      });
    });
    
    // Check for optimized images
    const optimizedImages = promotions.filter(p => 
      p.imageUrl.includes('/images/products/') && p.imageUrl.endsWith('.webp')
    );
    
    const originalImages = promotions.filter(p => 
      !p.imageUrl.includes('/images/products/') && !p.imageUrl.startsWith('data:')
    );
    
    console.log(`\n=== IMAGE ANALYSIS ===`);
    console.log(`Optimized images (local WebP): ${optimizedImages.length}`);
    console.log(`Original images (external): ${originalImages.length}`);
    
    optimizedImages.forEach(p => {
      console.log(`  ${p.storeName}: ${p.imageUrl} (${p.shortId})`);
    });
    
    console.log('\nOriginal images:');
    originalImages.forEach(p => {
      console.log(`  ${p.storeName}: ${p.imageUrl.substring(0, 80)}...`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();