import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

interface ImageProcessResult {
  success: boolean;
  optimizedPath?: string;
  publicUrl?: string;
  error?: string;
}

export class ImageProcessor {
  private static readonly OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'products');
  private static readonly TARGET_SIZE = 600;
  private static readonly MAX_FILE_SIZE = 300 * 1024; // 300KB
  
  static async ensureOutputDirectory(): Promise<void> {
    try {
      if (!existsSync(this.OUTPUT_DIR)) {
        await fs.mkdir(this.OUTPUT_DIR, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating output directory:', error);
      throw error;
    }
  }

  static generateOptimizedFilename(originalUrl: string, shortId: string): string {
    // Create a safe filename using the shortId and ensure .webp extension
    return `${shortId}.webp`;
  }

  static async downloadImage(imageUrl: string): Promise<Buffer> {
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

  static async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Process the image with Sharp
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

      // If file is still too large, reduce quality further
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

  static async processProductImage(originalImageUrl: string, shortId: string): Promise<ImageProcessResult> {
    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Generate optimized filename
      const optimizedFilename = this.generateOptimizedFilename(originalImageUrl, shortId);
      const outputPath = path.join(this.OUTPUT_DIR, optimizedFilename);
      const publicUrl = `/images/products/${optimizedFilename}`;

      // Check if optimized version already exists
      if (existsSync(outputPath)) {
        console.log(`Optimized image already exists: ${publicUrl}`);
        return {
          success: true,
          optimizedPath: outputPath,
          publicUrl
        };
      }

      // Download original image
      console.log(`Downloading image from: ${originalImageUrl}`);
      const imageBuffer = await this.downloadImage(originalImageUrl);

      // Optimize the image
      console.log('Optimizing image...');
      const optimizedBuffer = await this.optimizeImage(imageBuffer);

      // Save optimized image
      await fs.writeFile(outputPath, optimizedBuffer);
      console.log(`Optimized image saved: ${outputPath}`);

      return {
        success: true,
        optimizedPath: outputPath,
        publicUrl
      };

    } catch (error) {
      console.error('Error processing product image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async processExistingImages(): Promise<void> {
    // This method can be used to batch process existing images
    console.log('Starting batch processing of existing images...');
    // Implementation for processing existing images in the database
  }

  static getAbsoluteImageUrl(publicUrl: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.farejai.shop';
    return `${baseUrl}${publicUrl}`;
  }
}