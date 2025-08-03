# CONTEXTO COMPLETO DO PROJETO FAREJA

## 📋 RESUMO EXECUTIVO

**Site:** fareja.ai  
**URL de Produção:** https://www.fareja.ai  
**Hospedagem:** Vercel  
**Repositório:** Git com deploy automático  
**Tecnologia:** Next.js 15, React 19, TypeScript, Prisma, PostgreSQL, Tailwind CSS  

Este é um sistema completo de agregação de promoções e ofertas online brasileiro, com integração WhatsApp e automação via scripts Python + Selenium.

---

## 🏗️ ARQUITETURA DO SISTEMA

### **Frontend (Next.js 15)**
```
/app
├── page.tsx                    # Página principal com lista de promoções
├── layout.tsx                  # Layout global com meta tags
├── globals.css                 # Estilos globais
├── admin/page.tsx              # Painel administrativo
├── cupons/page.tsx             # Página de cupons
├── p/[shortId]/page.tsx        # Páginas individuais de produtos
└── api/
    └── promotions/
        ├── route.ts            # API CRUD de promoções
        └── [shortId]/route.ts  # API de produto específico
```

### **Componentes React**
```
/components
├── PromotionCard.tsx           # Card individual de promoção
├── MorePromotions.tsx          # Componente de "mais promoções"
├── ProductHeader.tsx           # Cabeçalho do produto
└── RelatedProducts.tsx         # Produtos relacionados
```

### **Bibliotecas e Utilitários**
```
/lib
├── prisma.ts                   # Cliente do banco PostgreSQL
├── scraper.ts                  # Scraping de imagens (Amazon/ML)
├── shortId.ts                  # Geração de IDs únicos
├── storeLogo.ts                # Logos das lojas
├── imageOptimizer.ts           # Otimização WebP
└── imageProcessor.ts           # Processamento para WhatsApp
```

---

## 🗄️ BANCO DE DADOS

### **Modelo de Dados (Prisma)**
```sql
model Promotion {
  id            String   @id @default(cuid())
  shortId       String   @unique @default(cuid())  -- URL amigável
  title         String                             -- Título do produto
  price         String                             -- Preço final
  price_from    String?                            -- Preço original
  storeName     String                             -- Nome da loja
  affiliateLink String   @unique                   -- Link de afiliado
  imageUrl      String                             -- URL da imagem
  coupon        String?                            -- Cupom de desconto
  createdAt     DateTime @default(now())           -- Data de criação
}
```

**Provedor:** PostgreSQL  
**ORM:** Prisma 6.11.1  
**Recursos:** Geração automática, migrações, cliente type-safe  

---

## 🔧 FUNCIONALIDADES PRINCIPAIS

### **1. Sistema de Promoções**
- **Criação:** API REST com autenticação Bearer token
- **Scraping Automático:** Extrai imagens de Amazon e Mercado Livre
- **Otimização:** Converte imagens para WebP (1200x630px para WhatsApp)
- **Deduplicação:** Previne produtos duplicados por link e título/data
- **URLs Amigáveis:** Sistema de shortId para compartilhamento

### **2. Interface do Usuário**
- **Layout Responsivo:** Mobile-first com Tailwind CSS
- **Scroll Infinito:** Paginação automática (20 itens por página)
- **Filtros:** Por loja (Amazon, ML, Magalu, AliExpress, etc.)
- **Busca:** Pesquisa em tempo real por título
- **Cards Interativos:** Hover effects, logos das lojas, badges de desconto

### **3. Painel Administrativo**
- **URL:** `/admin`
- **Autenticação:** Chave API via Bearer token
- **Funcionalidades:**
  - Adicionar promoções manualmente
  - Listar todas as promoções
  - Deletar promoções (individual ou em massa)
  - Deletar por período específico
  - Copiar links para compartilhamento
  - Logs detalhados de erro

### **4. Integração WhatsApp**
- **Meta Tags OpenGraph:** Previews otimizados
- **Imagens Otimizadas:** 1200x630px, formato WebP, <300KB
- **Link de Grupo:** https://chat.whatsapp.com/EIrN3j3ndMH6SV3pCWDfJz
- **Call-to-Action:** Sidebar promocional para adesão

---

## 🛠️ SCRAPING E PROCESSAMENTO

### **Suporte Multi-Platform**
```javascript
// Amazon
- data-a-dynamic-image (JSON parsing)
- id="landingImage" (fallback)
- URLs diretas de imagem

// Mercado Livre  
- class="ui-pdp-image" (imagem principal)
- data-zoom (alta qualidade)
- mlstatic.com URLs (filtradas por qualidade)
- __PRELOADED_STATE__ (JSON do produto)
```

### **Pipeline de Processamento**
1. **Detecção:** Identifica plataforma pelo URL
2. **Extração:** Múltiplos métodos por prioridade
3. **Download:** Fetch da imagem original
4. **Otimização:** Conversão WebP + redimensionamento
5. **Armazenamento:** `/public/images/products/{shortId}.webp`

### **Fallback System**
- Imagem padrão SVG otimizada (600x600px)
- Timeout de 8 segundos para scraping
- Headers User-Agent para bypass básico
- Error handling robusto

---

## 🤖 AUTOMAÇÃO PYTHON + SELENIUM

### **Script Principal: whatsapp_promotions_script.py**

#### **Configuração do Ambiente**
```python
CHROME_PROFILE_PATH = "C:\\Users\\Nilton\\Desktop\\Fareja\\CP3\\ChromeProfile"
CHROMEDRIVER_PATH = "C:\\Users\\Nilton\\Desktop\\Chromedriver\\chromedriver-win64\\chromedriver.exe"
API_BASE_URL = "https://www.fareja.ai"
API_SECRET_KEY = "farejai-secure-2024-admin-key"
```

#### **Mapeamento de Grupos WhatsApp**
```python
FILE_TO_GROUP_MAPPING = {
    "pechinchou-recentes.xlsx": [
        "Fareja.ai - Promoções #56",
        "Fareja.ai - Promoções #57",
        "Fareja.ai - Promoções #58",
        "Fareja.ai - Promoções #21"
    ],
    "pechinchou-informática.xlsx": ["Fareja.ai - Tech #19"],
    "pechinchou-games.xlsx": ["Fareja.ai - Tech #19"],
    "pechinchou-smartphone.xlsx": ["Fareja.ai - Tech #19", "Fareja.ai - Smartphone #21"],
    "pechinchou-SmartTV.xlsx": ["Fareja.ai - Tech #19", "Fareja.ai - Smart-TV #44"],
    "pechinchou-bebidas.xlsx": ["Fareja.ai - Bebidas #55", "Fareja.ai - Supermercado #71"]
}
```

#### **Estrutura de Pastas**
```
Desktop/Fareja/
├── Source/          # Arquivos Excel originais
├── Queue/           # Fila de processamento  
├── Main/            # Histórico processado
└── Logs/            # Logs do sistema
```

#### **Colunas dos Arquivos Excel**
```python
ALL_EXPECTED_COLUMNS = [
    'TITLE',        # Título do produto
    'STORE',        # Nome da loja
    'Cupom',        # Código de cupom
    'SALE_DATE',    # Data da promoção
    'DE',           # Preço original
    'PRICE',        # Preço final
    'Link',         # Link original
    'freight',      # Frete
    'FLAG',         # Status (NEW/SENT/etc)
    'FINAL_LINK',   # Link processado
    'DONE',         # Processamento concluído
    'SCRAP_DATE',   # Data do scraping
    'FINAL_LINK_CONVERTED_ATTEMPTED', # Tentativa de conversão
    'DONE_WHATSAPP' # Envio WhatsApp concluído
]
```

#### **Fluxo de Automação**
1. **Monitoramento:** Verifica arquivos na pasta Source
2. **Filtros:** Processa apenas itens 'NEW' dos últimos 30 minutos
3. **Validação:** Amazon e Mercado Livre apenas, sem bit.ly
4. **API Integration:** Envia para fareja.ai via API
5. **WhatsApp:** Automação completa com Selenium WebDriver
6. **Mobile UX:** Botão WhatsApp integrado no header mobile
7. **Preços:** Formatação automática com R$ nos valores
6. **Logging:** Sistema de logs rotativos com 7 dias de retenção

#### **Formatação de Mensagens WhatsApp**
```python
def format_whatsapp_message(title, de, price, coupon, final_link):
    # Título encurtado + preços + cupom + link promocional
    return f"🔥 {title[:80]}...\n💰 R$ {price}\n🎟️ {coupon}\n🔗 {final_link}"
```

---

## 🚀 PROCESSO DE DEPLOY

### **Git → Vercel Pipeline**
1. **Push Local:** Código commitado para repositório Git
2. **Trigger Automático:** Vercel detecta mudanças
3. **Build Process:** 
   ```bash
   npx prisma db push
   npx prisma generate  
   next build
   ```
4. **Deploy:** Aplicação atualizada automaticamente
5. **Backup:** Versões salvas no Windows e Linux

### **Estrutura de Backups**
```
# Linux (WSL)
/home/junitu/fareja/                    # Versão principal
/home/junitu/fareja-clone/              # Clone para testes
/home/junitu/fareja-clone-backup.tar.gz # Backup compactado

# Windows (Desktop)
Scripts Python atualizados a cada modificação
Arquivos Excel de promoções na estrutura de pastas
```

---

## 🔐 SEGURANÇA E AUTENTICAÇÃO

### **API Security**
- **Bearer Token:** `farejai-secure-2024-admin-key`
- **Environment Variable:** `API_SECRET_KEY`
- **Request Validation:** Headers obrigatórios
- **Rate Limiting:** Implícito via Vercel

### **Data Validation**
- **Required Fields:** title, price, storeName, affiliateLink
- **URL Validation:** Affiliate links válidos
- **Duplicate Prevention:** Unique constraints no banco
- **Sanitização:** Preços e valores limpos

---

## 🏪 LOJAS SUPORTADAS

### **Scraping Completo**
- ✅ **Amazon** (.amazon.com, .amzn.to)
- ✅ **Mercado Livre** (.mercadolivre.com, .mercadolibre.com)

### **Logos e Filtros**
- Amazon (23 Cupons)
- Mercado Livre (183 Cupons)  
- Magalu (13 Cupons)
- AliExpress (2 Cupons)
- Americanas (5 Cupons)
- Shopee (10 Cupons)

---

## 📊 MÉTRICAS E PERFORMANCE

### **SEO Optimization**
```html
<meta property="og:title" content="Produto - R$ 99,99" />
<meta property="og:description" content="🔥 Oferta: R$ 99,99 (50% OFF)" />
<meta property="og:image" content="/images/products/abc123.webp" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### **Image Optimization**
- **Formato:** WebP para melhor compressão
- **Dimensões:** 1200x630px (WhatsApp recommended)
- **Tamanho:** <300KB para carregamento rápido
- **Fallback:** SVG padrão quando scraping falha

### **Loading Performance**
- **Scroll Infinito:** 20 itens por página
- **Lazy Loading:** Next.js Image component
- **Caching:** Next.js automatic static optimization
- **CDN:** Vercel Edge Network

---

## 🔄 WORKFLOW DE TRABALHO

### **Desenvolvimento Local**
1. `npm run dev` - Servidor de desenvolvimento
2. Modificações no código
3. Testes locais
4. Commit para Git

### **Deploy Production**
1. Push automático para Vercel
2. Build e deploy automático
3. Backup para Windows/Linux
4. Atualização de scripts Python se necessário

### **Scripts Python**
1. Atualização na pasta Desktop/Windows
2. Execução contínua para automação
3. Monitoramento de logs
4. Backup de arquivos Excel processados

---

## 🛠️ COMANDOS ÚTEIS

### **Next.js**
```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm start           # Produção
npm run lint        # Linting
```

### **Prisma**
```bash
npx prisma studio    # Interface do banco
npx prisma db push   # Atualizar schema
npx prisma generate  # Gerar cliente
```

### **Git**
```bash
git add .
git commit -m "feat: descrição da atualização"
git push origin main
```

---

## 📝 ESTRUTURA DE ARQUIVOS

```
fareja/
├── app/                     # Next.js App Router
│   ├── admin/page.tsx       # Painel administrativo
│   ├── api/promotions/      # API REST
│   ├── cupons/page.tsx      # Página de cupons
│   ├── p/[shortId]/         # Páginas de produto
│   ├── layout.tsx           # Layout global
│   ├── page.tsx             # Homepage
│   └── globals.css          # Estilos globais
├── components/              # Componentes React
├── lib/                     # Utilitários e configurações
├── prisma/                  # Schema e migrações
├── public/                  # Assets estáticos
│   ├── images/products/     # Imagens otimizadas
│   └── *-logo.png          # Logos das lojas
├── scripts/                 # Scripts auxiliares
├── package.json            # Dependências
├── next.config.ts          # Configuração Next.js
├── prisma/schema.prisma    # Schema do banco
├── README.md               # Documentação básica
├── MERCADOLIVRE-INTEGRATION.md # Docs técnicas
└── CONTEXTO_COMPLETO_PROJETO.md # Este arquivo
```

---

## 🆕 ATUALIZAÇÕES RECENTES (27/07/2025)

### **Migração de Domínio**
- ✅ **Domínio antigo:** farejai.shop → **Novo:** fareja.ai
- ✅ **Meta tags atualizadas** em layout.tsx
- ✅ **Título alterado** de "Fareja" para "Fareja.ai"

### **Melhorias UX Mobile**
- ✅ **WhatsApp header:** Botão "📱 Grupo VIP WhatsApp" no mobile
- ✅ **Posicionamento:** Canto direito alinhado ao card do produto
- ✅ **Sticky behavior:** Acompanha scroll da página
- ✅ **Background:** Cor da página (gray-100) em vez de azul marinho

### **Funcionalidade de Cupons**
- ✅ **Copy to clipboard:** Cupons clicáveis com feedback visual
- ✅ **Homepage:** Implementado em PromotionCard.tsx
- ✅ **Produto:** Componente CopyableCoupon.tsx separado (client-side)
- ✅ **Error handling:** Separação Server/Client components

### **Formatação de Preços**
- ✅ **Homepage:** R$ automático nos cards (PromotionCard.tsx:110,114)
- ✅ **Produto:** R$ automático na página individual (page.tsx:145,149)
- ✅ **Lógica condicional:** Evita duplicação do símbolo R$

### **Correções Técnicas**
- ✅ **Server-side errors:** CopyableCoupon client component
- ✅ **Vercel build errors:** Price type handling (string/number)
- ✅ **EROFS errors:** Remoção ImageProcessor filesystem
- ✅ **WhatsApp preview:** Sistema mantido 100% funcional

---

## 🔧 VARIÁVEIS DE AMBIENTE

```env
# Produção (Vercel)
DATABASE_URL=postgresql://...
API_SECRET_KEY=farejai-secure-2024-admin-key
NEXT_PUBLIC_BASE_URL=https://www.fareja.ai

# Desenvolvimento Local
DATABASE_URL=file:./dev.db
API_SECRET_KEY=your-secret-key-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## ⚠️ PONTOS DE ATENÇÃO

### **Limitações do Vercel**
- Timeout de 10 segundos para funções
- Sem armazenamento persistente de arquivos
- Scraping pode falhar com sites complexos

### **Dependências Críticas**
- Puppeteer para scraping pode ser instável
- Selenium no Windows precisa ChromeDriver atualizado
- PostgreSQL deve estar sempre disponível

### **Manutenção Necessária**
- Atualizar seletores CSS se sites mudarem layout
- Monitorar logs do WhatsApp bot
- Backup regular dos arquivos Excel
- Verificar status dos grupos WhatsApp

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **Monitoramento:** Implementar analytics e métricas
2. **Performance:** Cache Redis para queries frequentes
3. **Segurança:** Rate limiting mais robusto
4. **Escalabilidade:** Queue system para processamento
5. **Mobile:** PWA para melhor experiência mobile
6. **API:** Webhook para notificações de novas promoções

---

**Última Atualização:** 27 de julho de 2025  
**Versão do Sistema:** Next.js 15.3.4, React 19, Prisma 6.11.1  
**Status:** Produção ativa em fareja.ai