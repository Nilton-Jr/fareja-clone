const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Algumas imagens de exemplo para testar
const sampleImages = [
  {
    url: 'https://http2.mlstatic.com/D_NQ_NP_759711-MLB79702938691_102024-O.webp',
    shortId: 'sample1'
  },
  {
    url: 'https://m.media-amazon.com/images/I/61OHIJ3gmBL._AC_SY450_.jpg',
    shortId: 'sample2'
  },
  {
    url: 'https://http2.mlstatic.com/D_NQ_NP_726295-MLA85411349695_052025-O.webp',
    shortId: 'sample3'
  }
];

async function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(filePath);
    
    https.get(url, (response) => {
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
    }).on('error', (err) => {
      file.close();
      fs.unlink(filePath).catch(() => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('📥 Downloading sample images for testing...\n');
  
  try {
    // Criar diretório
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');
    await fs.mkdir(imagesDir, { recursive: true });
    console.log(`✅ Directory created: ${imagesDir}\n`);
    
    for (const img of sampleImages) {
      console.log(`Downloading ${img.shortId}...`);
      
      try {
        const extension = img.url.includes('.webp') ? 'webp' : 'jpg';
        const filename = `${img.shortId}.${extension}`;
        const filePath = path.join(imagesDir, filename);
        
        await downloadImage(img.url, filePath);
        
        const stats = await fs.stat(filePath);
        console.log(`✅ ${filename} - ${Math.round(stats.size / 1024)}KB\n`);
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message}\n`);
      }
    }
    
    console.log('✅ Sample download complete!');
    console.log('These images will demonstrate the local asset approach.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();