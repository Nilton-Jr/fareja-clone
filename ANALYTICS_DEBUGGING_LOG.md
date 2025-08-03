# Analytics Dashboard Debugging Log

## Problemas Reportados pelo Usuário

### 1. Dashboard não contabiliza cliques
- Cliques em "Pegar Promoção" não aparecem no dashboard (sempre 0)
- Problema afeta tanto página principal quanto páginas de produto

### 2. Gráfico invertido/errado
- Gráfico de linha estava de cabeça para baixo
- Usuário pediu separação em dois gráficos: um para visualizações, outro para cliques

### 3. Filtros não funcionam completamente
- Filtros por loja (Amazon, Mercado Livre) só afetam cliques
- Visualizações, visitantes únicos e conversão ficam em 0 quando filtros aplicados
- Gráficos não obedecem aos filtros

## Exemplos Específicos do Problema
```
SEM FILTROS:
- 122 Visualizações (R$ 15.592.979,60)
- 93 Visitantes Únicos  
- 4 Cliques (R$ 229.141,00)
- 3.28% Taxa de Conversão

COM FILTRO AMAZON:
- 0 Visualizações (R$ 12.950.390,60) ❌
- 0 Visitantes Únicos ❌
- 2 Cliques (R$ 210.789,00) ✅
- 0% Taxa de Conversão ❌

COM FILTRO MERCADO LIVRE:
- 0 Visualizações (R$ 2.642.589,00) ❌
- 0 Visitantes Únicos ❌
- 2 Cliques (R$ 18.352,00) ✅
- 0% Taxa de Conversão ❌
```

## Soluções Implementadas

### 1. ✅ Correção do Hook de Analytics
**Arquivo:** `/hooks/useAnalytics.ts`
**Problema:** Hook enviava dados em formato plano, mas API esperava formato aninhado
```typescript
// ANTES (errado)
body: JSON.stringify({
  type: 'promotion_click',
  promotionId,
  buttonType,
  ...
})

// DEPOIS (correto)  
body: JSON.stringify({
  type: 'promotion_click',
  data: {
    promotionId,
    buttonType,
    ...
  }
})
```

### 2. ✅ Correção dos Gráficos
**Arquivo:** `/app/analytics-admin/page.tsx`
**Problema:** Gráfico único com 3 métricas e Y-axis invertido
**Solução:** Criados dois gráficos separados usando SimpleLineChart
```tsx
// Gráfico de Visualizações
<SimpleLineChart 
  data={chartData.map((d: any) => ({ date: d.date, value: d.pageViews }))}
  title="Visualizações Diárias"
  color="#2563eb"
  icon="👁️"
/>

// Gráfico de Cliques  
<SimpleLineChart 
  data={chartData.map((d: any) => ({ date: d.date, value: d.clicks }))}
  title="Cliques Diários"
  color="#9333ea"
  icon="🔗"
/>
```

### 3. ✅ Implementação da Lógica de Filtros
**Arquivo:** `/lib/analytics.ts`
**Problema:** Filtros não afetavam métricas principais
**Solução:** Adicionada lógica de filtragem baseada em shortIds das promoções
```typescript
// Obter shortIds das promoções que atendem aos filtros
const filteredPromotionShortIds = new Set();
promotionsData.forEach((promo: any) => {
  let matches = true;
  
  if (filters.storeName && promo.storeName !== filters.storeName) {
    matches = false;
  }
  
  if (filters.hasCoupon !== undefined) {
    const hasCoupon = !!promo.coupon;
    if (hasCoupon !== filters.hasCoupon) {
      matches = false;
    }
  }
  
  if (matches) {
    filteredPromotionShortIds.add(promo.shortId);
  }
});

// Filtrar analytics diários apenas para páginas das promoções filtradas
const filteredDaily = daily.filter((view: any) => {
  if (!view.page || !view.page.startsWith('/p/')) return false;
  const pageUrl = view.page;
  const match = pageUrl.match(/^\/p\/([^\/\?]+)/);
  if (!match) return false;
  
  const shortId = match[1];
  return filteredPromotionShortIds.has(shortId);
});
```

### 4. ✅ Debug e Identificação do Problema Principal
**Logs de Debug Revelaram:**
```
FILTER DEBUG - Total promotions found: 3281
FILTER DEBUG - Filtered promotion shortIds count: 3281  
FILTER DEBUG - Sample promotion shortIds: ['K2aECPUI', 'tgD7v78c', 'XKJ6dvOq', ...]
FILTER DEBUG - Total daily records: 100
FILTER DEBUG - Sample daily pages: [undefined, undefined, undefined, ...]
FILTER DEBUG - Filtered daily count: 0
```

**Problema Identificado:** Queries de analytics não selecionavam o campo `page`

### 5. ✅ Correção Final - Campo Page nas Queries
**Arquivo:** `/lib/analytics.ts`
**Problema:** Queries selecionavam apenas `timestamp` e `sessionId`
**Solução:** Adicionado `page: true` nas queries
```typescript
// ANTES
select: {
  timestamp: true,
  sessionId: true
},

// DEPOIS
select: {
  timestamp: true,
  sessionId: true,
  page: true
},
```

## Arquivos Modificados

1. **`/hooks/useAnalytics.ts`** - Correção formato de dados do hook
2. **`/app/analytics-admin/page.tsx`** - Substituição por dois gráficos separados
3. **`/lib/analytics.ts`** - Implementação completa da lógica de filtros + correção queries
4. **`/app/api/analytics/track/route.ts`** - Verificado (estava correto)
5. **`/components/PromotionCard.tsx`** - Verificado (tracking funcionando)

## Commits Realizados

1. `16386b0` - Add comprehensive debugging to analytics filtering logic
2. `0790ded` - Fix analytics filtering by including page field in daily stats query

## Status Atual

### ✅ Problemas Resolvidos
- Hook de analytics corrigido (formato de dados)
- Gráficos separados e orientação correta
- Lógica de filtros implementada
- Campo `page` adicionado às queries
- Debug logs removidos

### ❓ Status Incerto (Necessita Teste)
- Filtros por loja devem mostrar visualizações corretas
- Filtros por cupom devem funcionar
- Gráficos devem refletir filtros aplicados
- Taxa de conversão deve calcular corretamente

### 🔄 Próximos Passos Para Retomar

1. **Teste os filtros após o deploy atual:**
   - Aplicar filtro "Amazon" e verificar se visualizações > 0
   - Aplicar filtro "Mercado Livre" e verificar métricas
   - Testar filtros de cupom
   - Verificar se gráficos respondem aos filtros

2. **Se ainda houver problemas:**
   - Verificar se tracking de page views está funcionando corretamente
   - Investigar se URLs das páginas estão no formato correto (`/p/shortId`)
   - Validar se shortIds das promoções coincidem com URLs das páginas

3. **Para retomar a sessão, me informe:**
   - "Preciso continuar a correção do analytics dashboard"
   - Envie este arquivo: `ANALYTICS_DEBUGGING_LOG.md`
   - Descreva quais problemas ainda persistem após os testes

## Comandos Úteis Para Debug

```bash
# Ver logs em tempo real no Vercel
vercel logs --follow

# Verificar se tracking está funcionando
# (Abrir console do navegador e verificar requests para /api/analytics/track)

# Commit e deploy
git add . && git commit -m "mensagem" && git push
```

## Arquitetura do Sistema

- **Frontend:** Next.js 15 com App Router
- **Database:** PostgreSQL com Prisma ORM
- **Analytics Tables:** `Analytics`, `PromotionClick`, `PromotionView`, `Promotion`
- **Tracking:** Client-side hooks + server-side API endpoints
- **Charts:** SVG components customizados
- **Filtering:** Baseado em shortIds das promoções

---
*Log criado em: 2025-07-27*
*Última atualização: Correção do campo page nas queries de analytics*