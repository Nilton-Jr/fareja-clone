# Integração Mercado Livre - Guia Técnico

## 🎯 Funcionalidades Implementadas

### **Suporte Multi-Platform Scraping**
O scraper agora detecta automaticamente e processa produtos de:
- ✅ **Amazon** (.amazon.com, .amzn.to)
- ✅ **Mercado Livre** (.mercadolivre.com, .mercadolibre.com)

### **Métodos de Detecção de Imagem - Mercado Livre**

#### **1. Imagem Principal (Classe CSS)**
```javascript
// Procura pela imagem com classe ui-pdp-image
/<img[^>]+class="[^"]*ui-pdp-image[^"]*"[^>]+src="([^"]+)"/
```

#### **2. Imagem de Alta Qualidade (Data Zoom)**
```javascript
// Procura pelo atributo data-zoom
/data-zoom="([^"]+)"/
```

#### **3. URLs mlstatic.com Diretas**
```javascript
// Procura por todas as URLs mlstatic.com
/https?:\/\/[^"'\s]*mlstatic\.com[^"'\s]*\.(jpg|jpeg|png|webp)/gi

// Filtra apenas imagens de produto (não thumbnails)
// Prioriza: -O. (original), -F. (full), -V. (variant)
// Evita: -S. (small), -T. (thumbnail)
```

#### **4. Estado da Página (JSON)**
```javascript
// Extrai do __PRELOADED_STATE__
/__PRELOADED_STATE__\s*=\s*({.+?});/

// Acessa: state.item.pictures[0].secure_url
```

## 🔧 Como Usar

### **API de Promoções**
```bash
curl -X POST http://localhost:3000/api/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key-here" \
  -d '{
    "title": "Relógio Smartwatch Esportivo GPS",
    "price": "R$ 299,99",
    "price_from": "R$ 599,99",
    "storeName": "Mercado Livre",
    "affiliateLink": "https://produto.mercadolivre.com.br/MLB-5252847818-relogio-smartwatch-esportivo-gps-autnomo-amoled-47mm-2025-_JM"
  }'
```

### **URLs Suportadas**
```
✅ https://produto.mercadolivre.com.br/MLB-5252847818-relogio-smartwatch-esportivo-gps-autnomo-amoled-47mm-2025-_JM
✅ https://mercadolivre.com/sec/1iacb29
✅ https://mercadolibre.com.ar/MLA-123456789-producto
✅ https://listado.mercadolibre.com.mx/producto
```

## 🖼️ Otimização de Imagens

### **Processo Automático**
1. **Scraping** → Detecta e extrai URL da imagem
2. **Download** → Baixa a imagem original
3. **Conversão** → Converte para WebP
4. **Redimensionamento** → 1200x630px (WhatsApp)
5. **Compressão** → Máximo 300KB
6. **Salvamento** → `/public/images/products/{shortId}.webp`

### **Formatos de Saída**
- **Principal**: 1200x630px (rectangular)
- **Quadrada**: 400x400px (WhatsApp mobile)
- **Formato**: WebP otimizado
- **Tamanho**: < 300KB

## 🧪 Testes

### **Script de Teste**
```bash
node scripts/test-mercadolivre.js
```

### **Teste Manual via API**
1. Execute o servidor: `npm run dev`
2. Use a API de promoções com URL do ML
3. Verifique a imagem otimizada em `/public/images/products/`

## 📋 Meta Tags Geradas

### **Open Graph para WhatsApp**
```html
<meta property="og:title" content="Relógio Smartwatch... - R$ 299,99" />
<meta property="og:description" content="🔥 Oferta Mercado Livre: R$ 299,99 (50% OFF)" />
<meta property="og:image" content="https://seusite.com/images/products/abc123.webp" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/webp" />
```

## 🔍 Logs de Debug

### **Exemplos de Saída**
```
Detectado produto do Mercado Livre
Imagem principal ML encontrada: https://http2.mlstatic.com/D_NQ_NP_682178-MLB81622996224_012025-O.webp
Convertendo imagem para WebP: https://http2.mlstatic.com/...
Imagem convertida: /images/products/abc123.webp (245KB)
```

## 🚀 Benefícios

### **Para WhatsApp**
- ✅ **Previews perfeitos** com imagens otimizadas
- ✅ **Carregamento rápido** (WebP < 300KB)
- ✅ **Compatibilidade total** com formato recomendado

### **Para SEO**
- ✅ **Meta tags completas** para todas as plataformas
- ✅ **Structured data** otimizado
- ✅ **Performance** melhorada

### **Para Usuários**
- ✅ **Experiência consistente** entre Amazon e ML
- ✅ **Imagens de alta qualidade** em todos os dispositivos
- ✅ **Links funcionais** com previews atrativos