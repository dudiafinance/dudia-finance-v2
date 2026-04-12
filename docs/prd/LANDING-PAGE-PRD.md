# PRD — Landing Page / Auth Page Redesign
**Status:** Draft  
**Scope:** `src/app/page.tsx` only  
**Author:** DUD.IA Finance  
**Date:** 2026-04-12  

---

## 1. Overview

### 1.1 Problem Statement

A página inicial do DUDIA Finance (`/`) é o primeiro contato de qualquer usuário com o produto. Atualmente, ela comunica posicionamento técnico-engenheiro ("Engenharia de Fluxo de Caixa", "DUDIA Infrastructure / System v2.0.4") que:

1. **Não remete a finanças pessoais** — o usuário não consegue inferir o que o produto faz sem ler atentamente.
2. **Contém referência a IA removida** — o texto menciona "Gemini 2.0 e DeepSeek" e "roteamento de IA", funcionalidades que foram deliberadamente desativadas do produto.
3. **Branding confuso** — "DUDIA Infrastructure" e "System v2.0.4 // Production Build" parece documentação interna, não landing page de produto.
4. **Logos placeholder** — o footer contém três retângulos cinzas fantasmas sem conteúdo real.
5. **Proposta de valor genérica** — "terminal de alta precisão para quem enxerga patrimônio como sistema de engenharia" exclui o público geral sem entregar benefício claro.

### 1.2 Goal

Redesenhar a coluna esquerda da landing page para:
- Comunicar imediatamente que o DUDIA é um **gestor financeiro pessoal**.
- Mostrar benefícios concretos e reais (sem mencionar IA).
- Manter o estilo visual dark/minimalista já estabelecido.
- **Não alterar nenhum outro arquivo do sistema.**

---

## 2. Current State Analysis

### Arquivo alvo
```
src/app/page.tsx
```

### Layout atual
```
┌─────────────────────────┬──────────────────────────┐
│  LEFT COLUMN            │  RIGHT COLUMN            │
│  - Logo "D."            │  - Tab: Acessar / Criar  │
│  - "DUDIA Infra v2.0.4" │  - Clerk SignIn / SignUp │
│  - Headline "Engenharia │                          │
│    de Fluxo de Caixa"   │                          │
│  - Tagline c/ IA        │                          │
│  - 4 feature bullets    │                          │
│  - Footer (placeholder  │                          │
│    logos + texto)       │                          │
└─────────────────────────┴──────────────────────────┘
```

### Problemas mapeados

| ID | Problema | Severidade |
|----|----------|-----------|
| P1 | Referência a "Gemini 2.0 e DeepSeek" — IA removida | Alta |
| P2 | Feature bullet "Inteligência IA" com ícone `Cpu` | Alta |
| P3 | Branding "DUDIA Infrastructure / System v2.0.4" — confuso | Média |
| P4 | Headline "Engenharia de Fluxo de Caixa" — não remete a finanças | Média |
| P5 | Tagline menciona "roteamento de IA e análise preditiva" | Alta |
| P6 | Footer com 3 logos placeholder vazias | Baixa |
| P7 | Nenhum elemento visual financeiro (gráfico, número, moeda) | Alta |
| P8 | CTA implícito — usuário não sabe o que encontrará após logar | Média |

---

## 3. Target State

### 3.1 Visão geral

A coluna esquerda deve funcionar como uma **micro landing page** que:
1. Identifica o produto como gestor financeiro pessoal.
2. Mostra 3–4 benefícios concretos e reais baseados no que o sistema já faz.
3. Usa elementos visuais que remetem a finanças (números, moeda BRL, indicadores de saldo).
4. Mantém o estilo dark, minimalista, tipografia uppercase.

### 3.2 Estrutura proposta da coluna esquerda

```
┌─────────────────────────────────────┐
│  LOGO: "D." + "DUDIA Finance"       │
│                                     │
│  HEADLINE:                          │
│  "Controle Total                    │
│   das Suas                          │
│   Finanças."                        │
│                                     │
│  TAGLINE:                           │
│  "Organize contas, cartões,         │
│   metas e orçamentos em             │
│   um único lugar."                  │
│                                     │
│  STATS VISUAIS (mockup numérico):   │
│  ┌──────────┐ ┌──────────┐          │
│  │ Saldo    │ │ Metas    │          │
│  │ R$4.820  │ │ 3 ativas │          │
│  └──────────┘ └──────────┘          │
│                                     │
│  FEATURES (4 bullets):              │
│  🎯 Contas e Cartões                │
│  📊 Orçamentos por Categoria        │
│  🔒 Auditoria Automática            │
│  ⚡ Parcelas e Recorrências         │
│                                     │
│  FOOTER: "Seus dados. Sua segurança."│
└─────────────────────────────────────┘
```

---

## 4. Functional Requirements

### FR-01 — Remoção de referências a IA
- **Obrigatório:** Remover todo texto que mencione IA, Gemini, DeepSeek, "roteamento de IA", "análise preditiva".
- Substituir o bullet "Inteligência IA" (ícone `Cpu`) por funcionalidade real do sistema.

### FR-02 — Headline orientada ao usuário
- A headline principal (`<h1>`) deve comunicar o benefício direto para o usuário, não posicionamento técnico.
- Deve ser legível sem contexto adicional.
- Exemplos aprovados: "Controle Total das Suas Finanças.", "Organize Seu Dinheiro. De Verdade.", "Finalmente, Finanças que Fazem Sentido."

### FR-03 — Tagline descritiva
- O parágrafo abaixo da headline deve descrever em 1–2 frases o que o sistema faz concretamente.
- Deve mencionar ao menos 2 das entidades reais: contas, cartões de crédito, metas, orçamentos, categorias, transações, parcelas.

### FR-04 — Stats visuais mockup
- Adicionar um bloco visual de 2–4 cards com números fictícios que simulem o dashboard real.
- Os números devem usar formato BRL (R$) ou contagens simples.
- Exemplo: `R$ 4.820,00 / Saldo líquido`, `3 metas ativas`, `R$ 1.200 orçado este mês`.
- **Não devem ser dados reais** — são elementos puramente visuais/ilustrativos.
- Devem ter animação sutil de entrada (Framer Motion já disponível).

### FR-05 — 4 feature bullets reais
Substituir os 4 bullets por funcionalidades que existem no sistema:

| Ícone (lucide) | Título | Descrição |
|----------------|--------|-----------|
| `Wallet` | Contas e Cartões | Gerencie múltiplas contas e faturas de cartão em um único painel. |
| `PieChart` | Orçamentos | Defina limites por categoria e acompanhe seu progresso em tempo real. |
| `Target` | Metas Financeiras | Crie objetivos com prazo e acompanhe a evolução mês a mês. |
| `ShieldCheck` | Auditoria Automática | Consistência garantida com self-healing de saldos. |

### FR-06 — Branding corrigido
- Substituir "DUDIA Infrastructure" → **"DUDIA Finance"**
- Remover "System v2.0.4 // Production Build"
- Manter logo "D." existente

### FR-07 — Footer sem placeholders
- Remover os 3 retângulos cinzas (logos fantasmas).
- Substituir por texto descritivo simples: `"Seus dados. Sua segurança."` ou remover o footer completamente.
- Manter o texto `"Built with precision architecture • End-to-End Encrypted Identity"` ou simplificar para `"Dados protegidos com criptografia E2E"`.

### FR-08 — Mobile responsividade mantida
- Layout de coluna única em mobile (comportamento atual com `flex-col lg:flex-row`) deve ser preservado.
- Stats visuais devem colapsar para 2 colunas em mobile (já estão em grid, manter padrão).

---

## 5. Non-Functional Requirements

### NFR-01 — Performance
- Nenhuma imagem nova deve ser adicionada (zero HTTP requests adicionais).
- Stats visuais são puramente DOM/CSS — sem fetch de dados.
- Bundle size: nenhuma dependência nova além das já instaladas (`framer-motion`, `lucide-react`).

### NFR-02 — Acessibilidade
- `<h1>` único na página (já garantido).
- Stats visuais devem ter `aria-label` ou texto alternativo quando usarem apenas números.
- Contraste mínimo WCAG AA mantido.

### NFR-03 — Sem regressão no fluxo de auth
- A coluna direita (Clerk SignIn/SignUp) **não deve ser tocada**.
- `AuthContent` component permanece idêntico.
- Redirecionamento para `/dashboard` após login permanece.
- `?mode=signin` e `?mode=signup` continuam funcionando.

### NFR-04 — Consistência visual
- Manter paleta: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border/50`.
- Manter tipografia: `uppercase`, `tracking-widest`, tamanhos de fonte pequenos para metadados.
- Manter sombras: `shadow-precision` onde aplicável.
- Manter blur de fundo: blobs de cor roxa/azul já existentes.

---

## 6. Design Direction

### 6.1 Referências visuais de elementos financeiros

Os stats visuais devem ser cards pequenos, minimalistas, no estilo do dashboard existente:

```
┌─────────────────────────┐
│  SALDO LÍQUIDO          │
│  R$ 4.820,00            │
│  ▲ +12% este mês        │
└─────────────────────────┘
```

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Receitas │  │ Despesas │  │  Metas   │
│ R$8.400  │  │ R$3.580  │  │  3/5 ✓  │
└──────────┘  └──────────┘  └──────────┘
```

### 6.2 Hierarquia de copy

```
NÍVEL 1 — Headline (impacto máximo):
  "Controle Total
   das Suas
   Finanças."

NÍVEL 2 — Tagline (contexto, 1–2 frases):
  "Organize contas, cartões, metas e orçamentos.
   Tudo em um único painel, sempre atualizado."

NÍVEL 3 — Stats (prova visual, números fictícios):
  [R$ 4.820] [3 metas] [R$ 1.200 orçado]

NÍVEL 4 — Features (detalhes, 4 bullets):
  Contas e Cartões / Orçamentos / Metas / Auditoria
```

### 6.3 Animações (Framer Motion — já importado)

- Headline: `fade-in` + `y: 20 → 0` com `duration: 0.6`
- Stats cards: stagger de 0.1s entre cada card
- Feature bullets: stagger de 0.05s
- Nenhuma animação em loop (sem `animate: repeat`)

---

## 7. Scope Boundary

### Dentro do escopo
| Item | Status |
|------|--------|
| `src/app/page.tsx` — coluna esquerda | ✅ Modificar |
| Branding, headline, tagline | ✅ Modificar |
| Feature bullets | ✅ Substituir |
| Stats visuais (novo componente inline) | ✅ Adicionar |
| Footer da coluna esquerda | ✅ Corrigir |

### Fora do escopo
| Item | Motivo |
|------|--------|
| `AuthContent` component (coluna direita) | Clerk auth — não tocar |
| `src/app/(app)/dashboard/page.tsx` | Fora do escopo |
| Qualquer outro arquivo da aplicação | Explicitamente fora |
| Novas rotas ou páginas | Fora do escopo |
| Integração com dados reais na landing | Fora do escopo |
| Testes de integração para a page | Fora do escopo (page não tem lógica) |

---

## 8. Success Metrics

| Métrica | Critério de Aceite |
|---------|-------------------|
| Sem referência a IA | Zero ocorrências de "IA", "Gemini", "DeepSeek", "roteamento" |
| Branding correto | "DUDIA Finance" visível, sem "Infrastructure" ou "System v2.0.4" |
| Elemento financeiro visual | Ao menos 1 bloco com valor em R$ visível |
| Feature bullets reais | 4 bullets descrevem funcionalidades que existem no sistema |
| Mobile layout | Página utilizável em viewport 375px sem scroll horizontal |
| Auth funcional | Login e cadastro via Clerk continuam funcionando após mudança |
| Build sem erros | `npm run build` passa sem erros TypeScript |

---

## 9. Implementation Plan

### Task 1 — Corrigir branding e remover IA (P1, P2, P3, P5, P6)
**Arquivo:** `src/app/page.tsx`

- [ ] Substituir "DUDIA Infrastructure" → "DUDIA Finance"
- [ ] Remover "System v2.0.4 // Production Build"
- [ ] Remover import `Cpu` (substituído)
- [ ] Substituir feature bullet "Inteligência IA" (ícone `Cpu`) por "Metas Financeiras" (ícone `Target`)
- [ ] Reescrever tagline — remover "roteamento de IA e análise preditiva"
- [ ] Remover logos placeholder do footer (3 retângulos cinzas)

### Task 2 — Reescrever headline e tagline (P4, P7)
**Arquivo:** `src/app/page.tsx`

- [ ] Substituir headline "Engenharia de Fluxo de Caixa" por headline orientada ao usuário
- [ ] Reescrever parágrafo de tagline descrevendo funcionalidades reais
- [ ] Adicionar import de ícones novos necessários (`Wallet`, `PieChart` do lucide-react)

### Task 3 — Adicionar stats visuais mockup (P7)
**Arquivo:** `src/app/page.tsx`

- [ ] Criar bloco de stats inline (3 mini cards) com dados fictícios em BRL
- [ ] Adicionar animação de entrada com `motion.div` e stagger
- [ ] Validar responsividade mobile (grid 3 cols → 2 cols em sm)

### Task 4 — Substituir os 4 feature bullets
**Arquivo:** `src/app/page.tsx`

- [ ] Atualizar array de features com: Contas e Cartões, Orçamentos, Metas Financeiras, Auditoria Automática
- [ ] Ícones: `Wallet`, `PieChart`, `Target`, `ShieldCheck`
- [ ] Atualizar descrições de acordo com FR-05

### Task 5 — Validação final
- [ ] `npm run build` — zero erros TypeScript
- [ ] Verificar fluxo de login (Clerk SignIn)
- [ ] Verificar fluxo de cadastro (Clerk SignUp)
- [ ] Verificar mobile (375px viewport)
- [ ] Confirmar ausência de "IA", "Gemini", "DeepSeek" no código

---

## 10. Open Questions

| # | Questão | Decisão |
|---|---------|---------|
| OQ-1 | Headline exata: "Controle Total das Suas Finanças." ou "Organize Seu Dinheiro. De Verdade."? | A definir |
| OQ-2 | Stats visuais: 2, 3 ou 4 cards? | Recomendação: 3 (saldo, metas, orçamento) |
| OQ-3 | Footer: manter texto técnico ou substituir por "Dados protegidos com criptografia E2E"? | Recomendação: simplificar |
| OQ-4 | Animação nos stats: entrar ao montar ou ao scroll? | Recomendação: ao montar (página é above the fold) |

---

*PRD criado em 2026-04-12 • Escopo: src/app/page.tsx apenas*
