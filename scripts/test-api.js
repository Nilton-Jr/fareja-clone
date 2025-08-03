const samplePromotions = [
  {
    title: "Smartphone Samsung Galaxy A54 5G 128GB",
    price: "R$ 1.299,99",
    price_from: "R$ 1.599,99",
    storeName: "Amazon",
    affiliateLink: "https://amzn.to/3Iic0M0",
    coupon: "DESCONTO10"
  },
  {
    title: "Notebook Dell Inspiron 15 3000",
    price: "R$ 2.499,99",
    price_from: "R$ 2.999,99",
    storeName: "Dell",
    affiliateLink: "https://dell.com/example",
    coupon: "SAVE500"
  },
  {
    title: "Fone de Ouvido Bluetooth JBL",
    price: "R$ 149,99",
    price_from: "R$ 199,99",
    storeName: "JBL",
    affiliateLink: "https://jbl.com/example"
  }
];

async function testAPI() {
  const API_KEY = 'your-secret-key-here'; // Substitua pela sua chave
  const API_URL = 'http://localhost:3000/api/promotions';

  for (const promotion of samplePromotions) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(promotion)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Promoção criada: ${result.title}`);
      } else {
        const error = await response.json();
        console.log(`❌ Erro ao criar promoção: ${error.error}`);
      }
    } catch (error) {
      console.log(`❌ Erro de conexão: ${error.message}`);
    }
  }
}

// Para usar este script:
// 1. Certifique-se de que o servidor está rodando (npm run dev)
// 2. Instale node-fetch: npm install node-fetch
// 3. Execute: node scripts/test-api.js

console.log('Testando API...');
testAPI().then(() => console.log('Teste concluído!'));