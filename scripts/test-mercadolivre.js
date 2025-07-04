// Script para testar scraping do Mercado Livre
const { scrapeProductImage } = require('../lib/scraper.ts');

async function testMercadoLivre() {
  console.log('🧪 Testando scraping do Mercado Livre...\n');

  const testUrls = [
    'https://produto.mercadolivre.com.br/MLB-5252847818-relogio-smartwatch-esportivo-gps-autnomo-amoled-47mm-2025-_JM',
    'https://mercadolivre.com/sec/1iacb29', // URL curta do exemplo
  ];

  for (const url of testUrls) {
    try {
      console.log(`🔍 Testando: ${url}`);
      const imageUrl = await scrapeProductImage(url, 'test-ml-' + Date.now());
      console.log(`✅ Sucesso! Imagem encontrada: ${imageUrl}`);
      console.log('---');
    } catch (error) {
      console.error(`❌ Erro ao processar ${url}:`, error.message);
      console.log('---');
    }
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testMercadoLivre().catch(console.error);
}

module.exports = { testMercadoLivre };