const { PrismaClient } = require('@prisma/client');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const { existsSync } = require('fs');

const prisma = new PrismaClient();

class ImageOptimizer {
  static OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'products');
  static TARGET_SIZE = 600;
  static MAX_FILE_SIZE = 300 * 1024; // 300KB

  static async ensureOutputDirectory() {
    try {
      if (!existsSync(this.OUTPUT_DIR)) {
        await fs.mkdir(this.OUTPUT_DIR, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating output directory:', error);
      throw error;
    }
  }

  static async downloadImage(imageUrl) {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }

  static async optimizeImage(imageBuffer) {
    try {
      let processedBuffer = await sharp(imageBuffer)
        .resize(this.TARGET_SIZE, this.TARGET_SIZE, {
          fit: 'cover',
          position: 'center'
        })
        .webp({
          quality: 85,
          effort: 6
        })
        .toBuffer();

      // If file is still too large, reduce quality
      let quality = 85;
      while (processedBuffer.length > this.MAX_FILE_SIZE && quality > 50) {
        quality -= 10;
        processedBuffer = await sharp(imageBuffer)
          .resize(this.TARGET_SIZE, this.TARGET_SIZE, {
            fit: 'cover',
            position: 'center'
          })
          .webp({
            quality,
            effort: 6
          })
          .toBuffer();
      }

      console.log(`Image optimized: ${processedBuffer.length} bytes (quality: ${quality}%)`);
      return processedBuffer;
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw error;
    }
  }

  static async processPromotion(promotion) {
    try {
      const { id, shortId, imageUrl, title } = promotion;
      
      // Skip if imageUrl is a data URL or already optimized
      if (imageUrl.startsWith('data:') || imageUrl.includes('/images/products/')) {
        console.log(`Skipping ${shortId}: Already optimized or data URL`);
        return { success: true, skipped: true };
      }

      const optimizedFilename = `${shortId}.webp`;
      const outputPath = path.join(this.OUTPUT_DIR, optimizedFilename);
      const publicUrl = `/images/products/${optimizedFilename}`;

      // Check if optimized version already exists
      if (existsSync(outputPath)) {
        console.log(`Optimized image already exists for ${shortId}, updating database...`);
        
        // Update database with the optimized path
        await prisma.promotion.update({
          where: { id },
          data: {
            imageUrl: `https://www.farejai.shop${publicUrl}`
          }
        });
        
        return { success: true, updated: true };
      }

      console.log(`Processing: ${title.substring(0, 50)}... (${shortId})`);
      
      // Download original image
      const imageBuffer = await this.downloadImage(imageUrl);
      
      // Optimize the image
      const optimizedBuffer = await this.optimizeImage(imageBuffer);
      
      // Save optimized image
      await fs.writeFile(outputPath, optimizedBuffer);
      
      // Update database with the new optimized image URL
      await prisma.promotion.update({
        where: { id },
        data: {
          imageUrl: `https://www.farejai.shop${publicUrl}`
        }
      });
      
      console.log(`✅ Successfully processed: ${shortId}`);
      return { success: true, processed: true };
      
    } catch (error) {
      console.error(`❌ Error processing ${promotion.shortId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting batch image optimization for WhatsApp...');
    
    // Ensure output directory exists
    await ImageOptimizer.ensureOutputDirectory();
    
    // Get all promotions
    const promotions = await prisma.promotion.findMany({
      select: {
        id: true,
        shortId: true,
        imageUrl: true,
        title: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${promotions.length} promotions to process`);
    
    let processed = 0;
    let skipped = 0;
    let updated = 0;
    let errors = 0;
    
    for (const promotion of promotions) {
      const result = await ImageOptimizer.processPromotion(promotion);
      
      if (result.success) {
        if (result.skipped) {
          skipped++;
        } else if (result.updated) {
          updated++;
        } else if (result.processed) {
          processed++;
        }
      } else {
        errors++;
      }
      
      // Add a small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Processing Summary:');
    console.log(`✅ Processed: ${processed}`);
    console.log(`📁 Database Updated: ${updated}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📝 Total: ${promotions.length}`);
    console.log('\n🎯 All images are now optimized for WhatsApp preview!');
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { ImageOptimizer };