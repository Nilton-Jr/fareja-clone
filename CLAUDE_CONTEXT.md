# Contexto Completo - Problema WhatsApp Preview Fareja.ai

## Resumo Executivo

**Problema Principal**: Preview de imagens no WhatsApp funciona inconsistentemente - alguns grupos funcionam, outros não, e o padrão muda aleatoriamente.

**Diagnóstico Final**: O problema é **sobrecarga de infraestrutura** quando múltiplos grupos WhatsApp tentam acessar imagens simultaneamente através de proxies/servidores intermediários.

**Status Atual**: Implementação Cloudinary feita mas **NÃO FUNCIONANDO** porque variáveis de ambiente não estão configuradas no Vercel.

## Infraestrutura do Site

### Stack Tecnológico
- **Frontend/Backend**: Next.js 15 com App Router
- **Database**: PostgreSQL com Prisma ORM
- **Hosting**: Vercel (fareja.ai)
- **Imagens**: Tentativa de usar Cloudinary (não funcionando ainda)
- **Scraping**: Puppeteer para extrair imagens de Amazon/Mercado Livre

### Estrutura de Arquivos Principais
```
/app/api/promotions/route.ts    - API para criar promoções
/app/p/[shortId]/page.tsx       - Página do produto com meta tags
/lib/cloudinary.ts              - Upload para Cloudinary (criado)
/lib/scraper.ts                 - Scraping de imagens
/scripts/                       - Scripts de migração
```

## Histórico de Tentativas (Cronológico)

### 1. Cache-busting (FALHOU)
- Adicionamos parâmetros randômicos nas URLs
- Criamos 8 estratégias diferentes de cache
- **Resultado**: Não resolveu, problema persistiu

### 2. Otimização de Imagens (FALHOU)
- Tentamos Sharp para otimizar imagens
- Criamos proxy endpoints especializados
- **Resultado**: Vercel é read-only, não pode salvar arquivos

### 3. URLs Diretas (FALHOU)
- Removemos todos os proxies
- WhatsApp acessava Amazon/ML diretamente
- **Resultado**: Continuou inconsistente

### 4. Cloudinary (IMPLEMENTADO MAS NÃO ATIVO)
- Código implementado e funcionando
- Upload automático durante criação
- **Problema**: Variáveis não estão no Vercel
- **Resultado**: Sistema usa URLs originais como fallback

## Padrão do Problema Descoberto

1. **Grupos 57 e 58**: Sempre funcionaram
2. **Grupos 21 e 56**: Nunca funcionaram consistentemente
3. **Quando ativa novo bot**: Preview "migra" - funciona nos novos grupos mas para nos antigos
4. **Conclusão**: Problema é contenção de recursos quando múltiplos grupos acessam simultaneamente

## Solução Implementada (Cloudinary)

### Como deveria funcionar:
```
Criar Promoção → Scraping → Upload Cloudinary → URL CDN → WhatsApp OK
```

### Credenciais Cloudinary:
```
CLOUDINARY_CLOUD_NAME=ds3bntpck
CLOUDINARY_API_KEY=553234253863815
CLOUDINARY_API_SECRET=QXCaHgwwTdMC0occkeKRSxHyWFs
```

### Por que Cloudinary resolve:
1. **CDN Global**: Sem gargalos de infraestrutura
2. **URLs permanentes**: Sem problemas de cache
3. **Otimização automática**: 1200x630 para WhatsApp
4. **Sem limites do Vercel**: Escala infinitamente

## Tarefas Pendentes

1. **URGENTE**: Adicionar variáveis de ambiente no Vercel
2. **Verificar**: Se upload está funcionando após adicionar variáveis
3. **Migrar**: Executar script para migrar imagens existentes
4. **Testar**: Confirmar que todos os grupos funcionam

## Scripts Python (Desktop Windows)

- **RECENTES 2.py**: Envia para grupos 21 e 57
- **RECENTES 3.py**: Envia para grupos 56 e 58
- **Observação**: Scripts são idênticos, problema não está neles

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar localmente
npm run dev

# Migrar imagens para Cloudinary (após configurar variáveis)
node scripts/migrate-to-cloudinary.js

# Ver logs de produção
vercel logs
```

## Como Continuar

### Para o próximo Claude:

1. **Verificar se Cloudinary está funcionando**:
   - Checar se novas promoções têm URLs do Cloudinary
   - Verificar logs do Vercel para erros

2. **Se ainda não funcionar**:
   - Verificar se variáveis estão corretas no Vercel
   - Testar upload manual para Cloudinary
   - Considerar alternativas (ImgBB, S3, etc)

3. **Debugging**:
   - Use `console.log` na API para ver se Cloudinary está sendo chamado
   - Verifique Network tab para ver qual URL está nas meta tags

## Observações Importantes

1. **WhatsApp é muito sensível**: Pequenas mudanças podem quebrar preview
2. **Cache agressivo**: WhatsApp cacheia previews por muito tempo
3. **Problema é intermitente**: Não é consistente, relacionado a carga
4. **Pechinchou funciona**: Porque serve imagens como assets estáticos

## Modus Operandi de Trabalho

1. **Sempre commitar**: Usar Git para todas mudanças
2. **Deploy automático**: Vercel faz deploy ao push
3. **Testar em produção**: Problemas só aparecem com volume real
4. **Documentar tudo**: Manter registro de tentativas e resultados

---

**Última atualização**: 29/01/2025
**Problema começou**: Tarde do dia 29/01/2025
**Horas trabalhadas**: ~8 horas
**Status**: Cloudinary implementado mas não configurado no Vercel