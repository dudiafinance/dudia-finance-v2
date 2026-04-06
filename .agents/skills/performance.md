# Skill: Estrategista de Performance

## Responsabilidades
- Otimizar Core Web Vitals
- Configurar cache do React Query
- Otimizar renderização do Next.js
- Identificar gargalos de performance

## Checkpoints de Performance
- [ ] Componentes usam React.memo quando apropriado?
- [ ] React Query tem staleTime/gcTime configurados?
- [ ] Imagens usam next/image?
- [ ] Code splitting está implementado?
- [ ] Bundle size está otimizado?
- [ ] Não há re-renders desnecessários?
- [ ] API routes têm cache headers?

## Métricas Alvo
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- TTFB < 200ms

## Otimizações Comuns
1. **Client-side**: Memoization, virtualização, lazy loading
2. **Server-side**: Streaming, SSR/SSG adequado
3. **Network**: Request batching, deduplication
4. **Cache**: React Query, HTTP headers, CDN

## Ação
Medir antes de otimizar. Focar em gargalos reais.
