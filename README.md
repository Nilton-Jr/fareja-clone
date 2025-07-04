# Fareja Clone - Sistema de Promoções de Afiliados

Este é um clone do site fareja.ai que permite gerenciar e exibir promoções de produtos afiliados.

## Como usar o site

### 1. Instalação e Configuração

1. Abra o terminal no VS Code (ou qualquer terminal)
2. Execute: `npm install`
3. Execute: `npm run dev`
4. Abra seu navegador em: `http://localhost:3000`

### 2. Configuração da Chave de API

1. Abra o arquivo `.env.local` na raiz do projeto
2. Substitua `your-secret-key-here` por uma chave secreta segura (exemplo: `minha-chave-secreta-123`)
3. Salve o arquivo

### 3. Adicionando Promoções

Para adicionar uma nova promoção, use uma ferramenta como Postman ou curl:

```bash
curl -X POST http://localhost:3000/api/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sua-chave-secreta-aqui" \
  -d '{
    "title": "Smartphone Samsung Galaxy A54",
    "price": "R$ 1.299,99",
    "price_from": "R$ 1.599,99",
    "storeName": "Amazon",
    "affiliateLink": "https://amzn.to/3Iic0M0",
    "coupon": "DESCONTO10"
  }'
```

### 4. Campos da Promoção

- **title**: Título do produto (obrigatório)
- **price**: Preço com desconto (obrigatório)
- **price_from**: Preço original (opcional)
- **storeName**: Nome da loja (obrigatório)
- **affiliateLink**: Link de afiliado (obrigatório)
- **coupon**: Código de cupom (opcional)

### 5. Como Funciona

1. O sistema pega automaticamente a imagem do produto do link de afiliado
2. Tenta primeiro encontrar uma imagem com id="landingImage"
3. Se não encontrar, pega a maior imagem da página
4. Salva tudo no banco de dados SQLite
5. Exibe no site com scroll infinito

### 6. Estrutura do Projeto

```
fareja-clone/
├── app/
│   ├── api/promotions/          # API para gerenciar promoções
│   ├── globals.css              # Estilos globais
│   ├── layout.tsx               # Layout da aplicação
│   └── page.tsx                 # Página principal
├── components/
│   └── PromotionCard.tsx        # Componente do card de promoção
├── lib/
│   ├── prisma.ts                # Configuração do banco de dados
│   └── scraper.ts               # Serviço de captura de imagens
├── prisma/
│   ├── schema.prisma            # Schema do banco de dados
│   └── dev.db                   # Banco SQLite (criado automaticamente)
├── .env.local                   # Variáveis de ambiente
└── README.md                    # Este arquivo
```

### 7. Comandos Úteis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Cria versão de produção
- `npm start`: Inicia versão de produção
- `npx prisma studio`: Visualiza o banco de dados
- `npx prisma db push`: Atualiza o banco com mudanças no schema

### 8. Troubleshooting

**Erro de conexão com banco:**
- Verifique se o arquivo `prisma/dev.db` existe
- Execute: `npx prisma db push`

**Erro de imagem não encontrada:**
- Verifique se o link de afiliado está funcionando
- Alguns sites podem bloquear o scraping

**Erro de autorização na API:**
- Verifique se a chave no `.env.local` está correta
- Certifique-se de usar `Bearer` no header da requisição

### 9. Personalização

Para personalizar o visual:
- Edite `app/globals.css` para estilos globais
- Modifique `components/PromotionCard.tsx` para mudar o card
- Ajuste `app/page.tsx` para mudar o layout da página

### 10. Produção

Para colocar em produção:
1. Execute: `npm run build`
2. Execute: `npm start`
3. Configure um servidor web (nginx, Apache, etc.)
4. Configure um domínio
5. Configure SSL/HTTPS

## Suporte

Se tiver dúvidas, verifique:
1. Se todos os comandos foram executados corretamente
2. Se o Node.js está instalado (versão 18 ou superior)
3. Se todas as dependências foram instaladas com `npm install`
