// Script para testar criação de produto e verificar se o sistema de imagens está funcionando
const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_SECRET_KEY = process.env.API_SECRET_KEY || 'your-secret-key';

async function testCreateProduct() {
  console.log('=== Teste de Criação de Produto ===\n');
  
  const testProduct = {
    title: 'Produto Teste - Sistema de Imagem',
    price: '99.99',
    price_from: '199.99',
    storeName: 'Amazon',
    affiliateLink: 'https://www.amazon.com.br/dp/B08N5WRWNW', // Link real da Amazon
    coupon: 'TESTE10'
  };
  
  console.log('Dados do produto teste:');
  console.log(JSON.stringify(testProduct, null, 2));
  
  try {
    console.log('\n🔄 Enviando requisição para API...');
    
    const response = await fetch(`${API_URL}/api/promotions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_SECRET_KEY}`
      },
      body: JSON.stringify(testProduct)
    });
    
    const responseText = await response.text();
    console.log(`\n📡 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('\n✅ Produto criado com sucesso!');
      console.log(`📋 ID: ${result.id}`);
      console.log(`🔗 Short ID: ${result.shortId}`);
      console.log(`🖼️  Image URL: ${result.imageUrl}`);
      console.log(`🌐 Site Link: ${result.siteLink}`);
      
      // Verificar se a imagem é local ou externa
      if (result.imageUrl.startsWith('/images/products/')) {
        console.log('\n🎉 SUCESSO: Imagem salva localmente!');
      } else if (result.imageUrl.includes('amazon.com') || result.imageUrl.includes('media-amazon.com')) {
        console.log('\n⚠️  ATENÇÃO: Usando imagem da Amazon (fallback)');
      } else if (result.imageUrl.includes('cloudinary.com')) {
        console.log('\n⚠️  ATENÇÃO: Usando Cloudinary (fallback)');
      } else {
        console.log('\n❓ DESCONHECIDO: Tipo de imagem não identificado');
      }
      
      return result;
      
    } else {
      console.log('\n❌ Erro na criação:');
      console.log(responseText);
      return null;
    }
    
  } catch (error) {
    console.log('\n💥 Erro de rede/execução:');
    console.log(error.message);
    return null;
  }
}

async function testLocalImageSave() {
  console.log('\n=== Teste Direto da Função saveImageLocally ===\n');
  
  // Este teste só funciona se estivermos no ambiente com as dependências
  try {
    const fs = require('fs');
    const path = require('path');
    
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'products');
    console.log(`📁 Diretório de imagens: ${imagesDir}`);
    console.log(`📁 Diretório existe: ${fs.existsSync(imagesDir) ? '✅' : '❌'}`);
    
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      console.log(`📸 Total de imagens locais: ${files.length}`);
      
      files.slice(0, 5).forEach(file => {
        const filePath = path.join(imagesDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  ${file} - ${Math.round(stats.size / 1024)}KB`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Erro no teste local: ${error.message}`);
  }
}

async function runTests() {
  await testLocalImageSave();
  
  console.log('\n' + '='.repeat(50));
  console.log('INSTRUÇÕES PARA TESTE COMPLETO:');
  console.log('='.repeat(50));
  console.log('1. Definir variáveis de ambiente:');
  console.log('   export API_SECRET_KEY="sua-chave-secreta"');
  console.log('   export API_URL="https://fareja.ai" # ou localhost:3000');
  console.log('');
  console.log('2. Executar este script:');
  console.log('   node test-criar-produto.js');
  console.log('');
  console.log('3. Verificar resultado:');
  console.log('   - Se imageUrl começar com "/images/products/" = ✅ Sistema funcionando');
  console.log('   - Se imageUrl contiver "amazon.com" = ⚠️  Fallback sendo usado');
  console.log('');
  console.log('4. Para testar localmente:');
  console.log('   npm run dev');
  console.log('   # Em outro terminal:');
  console.log('   export API_SECRET_KEY="test"');
  console.log('   export API_URL="http://localhost:3000"');
  console.log('   node test-criar-produto.js');
  
  // Se as variáveis estiverem definidas, executar o teste
  if (process.env.API_SECRET_KEY && process.env.API_SECRET_KEY !== 'your-secret-key') {
    console.log('\n🚀 Executando teste automaticamente...');
    await testCreateProduct();
  } else {
    console.log('\n⏸️  Defina as variáveis de ambiente para executar o teste automaticamente.');
  }
}

runTests().catch(console.error);