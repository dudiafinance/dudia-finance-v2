# MASTER PRD: Auditoria Sistêmica 360° — DUD.IA Finance v2

> **Versão:** 2.0 | **Data:** Abril 2026 | **Classificação:** CONFIDENCIAL

---

## 1. Resumo Executivo

Este PRD define o escopo, a metodologia e os critérios de aceitação da **Auditoria Sistêmica 360°** do projeto DUD.IA Finance v2. O objetivo é elevar o sistema de "funcional" para **"Bank-Grade Quality"**, cobrindo segurança, performance, UX e escalabilidade através de um sistema multi-agente especializado.

- **Problema:** O sistema está funcional mas apresenta débitos técnicos críticos em segurança (ausência de RLS, rate limiting, auditoria de segredos), experiência de usuário (flickering, CLS) e escalabilidade (caching, pooling).
- **Solução:** Auditoria completa em 7 fases executada por agentes de IA especializados, cada um carregando skills operativas específicas, com entregáveis mensuráveis e critérios de aceitação claros.
- **Resultado esperado:** Sistema com zero erros de lint/TypeScript, cobertura de segurança OWASP Top 10, LCP < 2.5s, CLS < 0.1 e arquitetura pronta para escalar.

---

## 2. Contexto e Stack Técnico

### 2.1. Visão Geral do Projeto

| Atributo | Detalhe |
|----------|---------|
| **Nome** | DUD.IA Finance v2 |
| **Domínio** | Fintech — Gestão Financeira Pessoal |
| **Status** | Funcional, em refatoração para produção |
| **Compliance Alvo** | LGPD, GDPR, PCI-DSS (cartões) |

### 2.2. Stack Tecnológico

| Camada | Tecnologia | Versão/Detalhe |
|--------|-----------|----------------|
| Framework | Next.js (App Router) | 14+ |
| Linguagem | TypeScript | Strict mode obrigatório |
| Banco de Dados | PostgreSQL (Neon) | Serverless, com pooling |
| ORM | Drizzle ORM | — |
| Styling | Tailwind CSS | — |
| Animações | Framer Motion | — |
| Componentes UI | Radix UI (shadcn/ui) | — |
| Infraestrutura | Vercel (presumido) | Edge-ready |

### 2.3. Pré-requisitos da Auditoria

Antes de iniciar qualquer fase, o agente executor **deve obrigatoriamente**:

1. Ler o arquivo `MASTER_AUDIT_PRD.md` (este documento) na íntegra.
2. Ler o arquivo `AUDITORIA-FINANCEIRA.md` na raiz do projeto para contextualizar trabalhos já realizados e decisões históricas.
3. Verificar se o ambiente local compila sem erros (`npm run build`).
4. Executar `npm audit` para baseline de vulnerabilidades.

> **⚠️ REGRA FUNDAMENTAL:** Nenhum agente deve iniciar análise sem completar todos os 4 pré-requisitos acima.

---

## 3. Sistema Multi-Agente

A auditoria é executada por **agentes de IA especializados**, cada um com uma persona técnica distinta e skills operativas carregadas do repositório local. Esta arquitetura garante profundidade de análise sem perda de foco.

### 3.1. Regra de Ouro do Sistema

> **🔒 REGRA INVIOLÁVEL — APLICÁVEL A TODOS OS AGENTES:**
> 
> **Nunca fuja da lógica do sistema multi-agente.** Cada agente tem um escopo definido. Se encontrar um problema fora do seu domínio, **documente o achado e delegue ao agente correto.** Nunca tente resolver problemas que pertencem a outro agente. Esta regra garante rastreabilidade, qualidade e separação de responsabilidades.
>
> - O **Arquiteto** não corrige código — ele documenta e delega.
> - O **QA/Review** não implementa fixes — ele revisa e encaminha.
> - O **Backend** não mexe em componentes React — ele escala para o Frontend.
> - O **Frontend** não otimiza queries — ele escala para o Dados.
> - O **Segurança** não implementa correções — ele audita e convoca o Red Team ou Execução.
> - O **Red Team** não corrige vulnerabilidades — ele prova que existem e reporta.
> - O **Dados** não altera rotas de API — ele otimiza schema e queries.
> - O **Execução** não busca novos problemas — ele implementa fixes documentados.

### 3.2. Definição de Agentes

| Agente | Papel | Foco Principal |
|--------|-------|----------------|
| **Arquiteto** | Visão macro e design | Estrutura de pastas, padrões, escalabilidade |
| **QA/Review** | Qualidade de código | SOLID, bugs lógicos, anti-patterns |
| **Backend** | APIs e dados | Rotas, middleware, validação, auth |
| **Segurança** | Defesa sistêmica | OWASP, segredos, RLS, criptografia |
| **Red Team** | Ataque simulado | Pentest, bypass de auth, escalation |
| **UX/UI** | Experiência | CLS, animações, renderização, acessibilidade |
| **Dados** | Banco de dados | Índices, queries, relações, migrations |
| **Execução** | Correção cirúrgica | Fixes priorizados sem regressão |

### 3.3. Mapa de Skills Operativas

As skills estão localizadas em `claude-skills/` na raiz do projeto. Cada agente **deve carregar sua skill (SKILL.md)** antes de iniciar qualquer análise.

| Agente | Skill | Caminho Relativo | Arquivo |
|--------|-------|-------------------|---------|
| Arquiteto | `senior-architect` | `engineering-team/senior-architect/` | `SKILL.md` |
| QA/Review | `code-reviewer` | `engineering-team/code-reviewer/` | `SKILL.md` |
| Backend | `senior-backend` | `engineering-team/senior-backend/` | `SKILL.md` |
| UX/UI | `senior-frontend` | `engineering-team/senior-frontend/` | `SKILL.md` |
| Dados | `database-designer` | `engineering/database-designer/` | `SKILL.md` |
| Segurança | `skill-security-auditor` | `engineering/skill-security-auditor/` | `SKILL.md` |
| Red Team | `red-team` | `engineering-team/red-team/` | `SKILL.md` |
| Execução | `focused-fix` | `engineering/focused-fix/` | `SKILL.md` |

> **Se uma skill não existir no repositório:** O agente deve criar a skill seguindo o padrão documentado neste PRD antes de prosseguir. Cada SKILL.md deve conter, no mínimo: Persona, Escopo de Atuação, Regras Invioláveis (incluindo a regra de nunca fugir do sistema multi-agente), Checklist de Análise, formato de Output e Protocolo de Escalação.

### 3.4. Protocolo de Colaboração entre Agentes

Os agentes não operam de forma isolada. O protocolo de colaboração segue estas regras:

1. **Context Loading:** Cada agente lê este PRD e o `AUDITORIA-FINANCEIRA.md` antes de atuar.
2. **Skill Activation:** O agente carrega o `SKILL.md` da sua skill correspondente antes de analisar qualquer arquivo.
3. **Cross-Agent Handoff:** Quando um agente encontra um problema fora do seu domínio, ele documenta o achado com o formato padronizado do seu tipo (ex: `ARQ-001`, `API-003`, `SEC-007`) e convoca o agente especialista.
4. **Escalation Mode:** Se falhas de segurança críticas forem detectadas, o Agente de Segurança invoca automaticamente o Red Team para validação de penetração.
5. **Feedback Loop:** O Agente de Execução reporta o status de cada fix de volta ao agente que originou o achado, fechando o ciclo.

### 3.5. Formato Padronizado de Achados

Cada agente usa um prefixo próprio para rastreabilidade:

| Agente | Prefixo | Exemplo |
|--------|---------|---------|
| Arquiteto | `ARQ-` | `ARQ-001` |
| QA/Review | `REV-` | `REV-015` |
| Backend | `API-` | `API-003` |
| UX/UI | `UX-` | `UX-008` |
| Dados | `DB-` | `DB-012` |
| Segurança | `SEC-` | `SEC-007` |
| Red Team | `RT-` | `RT-004` |
| Execução | `FIX-` | `FIX-019` |

**Template mínimo de achado:**
```
### Achado {PREFIXO}-{NNN}
- **Severidade:** P0 | P1 | P2
- **Arquivo(s):** caminho/do/arquivo.ts
- **Problema:** Descrição clara
- **Impacto:** O que acontece se não corrigir
- **Recomendação:** Ação específica
- **Delegar para:** [Agente responsável pela correção]
```

---

## 4. Roteiro de Execução (7 Fases)

A auditoria é executada em **7 fases sequenciais**. Cada fase possui escopo, agentes responsáveis, checklist de verificação e critérios de conclusão específicos.

### Fase 1: Reconhecimento de Terreno

| Atributo | Detalhe |
|----------|---------|
| **Agente** | Arquiteto |
| **Skills** | `senior-architect` |
| **Escopo** | Raiz do projeto, configurações, estrutura de pastas |
| **Prioridade** | P0 — Bloqueia todas as fases seguintes |

**Checklist:**
- [ ] Executar `npm run lint` e catalogar todos os erros/warnings por arquivo
- [ ] Executar `npm run build` e documentar falhas de compilação
- [ ] Mapear a árvore de diretórios e identificar arquivos com maior complexidade ciclomática
- [ ] Revisar `tsconfig.json` para garantir `strict: true` e configurações de path aliases
- [ ] Gerar relatório de baseline com métricas atuais (nº de erros, warnings, dependências desatualizadas)
- [ ] Executar `npm audit` e documentar vulnerabilidades existentes

**Critério de conclusão:** Relatório de baseline gerado, lista priorizada de arquivos críticos, zero erros bloqueantes de build.

---

### Fase 2: Auditoria de Backend e APIs

| Atributo | Detalhe |
|----------|---------|
| **Agentes** | Backend + QA/Review |
| **Skills** | `senior-backend`, `code-reviewer` |
| **Escopo** | `src/app/api/**`, `src/lib/services/**` |
| **Prioridade** | P0 — Segurança financeira |

**Checklist:**
- [ ] Todas as rotas API possuem tratamento de erros com try/catch e respostas padronizadas
- [ ] Todas as entradas de usuário são validadas com Zod schemas
- [ ] Rotas protegidas verificam autenticação e autorização (middleware)
- [ ] Operações financeiras previnem double-spending (idempotency keys ou transações atômicas)
- [ ] Cálculos monetários usam inteiros (centavos) ou bibliotecas de precisão (Decimal.js), **nunca floats**
- [ ] Não existem dados sensíveis em logs de produção
- [ ] Respostas de API seguem formato padronizado (`{ success, data/error }`)
- [ ] Content-Type validado em todos os endpoints

**Critério de conclusão:** 100% das rotas validadas, zero violações de segurança financeira, padrão de erro consistente.

---

### Fase 3: Auditoria de Segurança Global

| Atributo | Detalhe |
|----------|---------|
| **Agentes** | Segurança + Red Team |
| **Skills** | `skill-security-auditor`, `red-team` |
| **Escopo** | Sistema completo (código, infra, deps, config) |
| **Prioridade** | P0 — Risco regulatório e de dados |

#### 3.1 — Secrets e Configuração
- [ ] Auditar `.env`, `.env.local` e variáveis de ambiente; nenhum segredo no código-fonte ou logs
- [ ] Verificar que `.gitignore` cobre todos os arquivos sensíveis
- [ ] Chaves de API com rotação documentada e permissões mínimas (least privilege)
- [ ] Variáveis `NEXT_PUBLIC_*` revisadas — apenas dados verdadeiramente públicos

#### 3.2 — Autenticação e Sessões
- [ ] JWT/Cookies com flags `HttpOnly`, `Secure`, `SameSite=Strict`
- [ ] Proteção contra fixação de sessão e regeneração de token pós-login
- [ ] Logout seguro com invalidação server-side do token
- [ ] Rate limiting no login para prevenir brute force

#### 3.3 — OWASP Top 10
- [ ] **A01 — Broken Access Control:** RBAC implementado, RLS no Neon para isolamento de dados por usuário
- [ ] **A02 — Cryptographic Failures:** Dados sensíveis criptografados em repouso e trânsito (TLS 1.3)
- [ ] **A03 — Injection:** Queries parametrizadas via Drizzle, sem concatenação de strings SQL
- [ ] **A04 — Insecure Design:** Limites de tentativas de login, fluxos de recuperação seguros
- [ ] **A05 — Security Misconfiguration:** Headers de segurança (CSP, HSTS, X-Frame-Options)
- [ ] **A06 — Vulnerable Components:** `npm audit` sem vulnerabilidades críticas ou altas
- [ ] **A07 — Auth Failures:** MFA recomendado, política de senhas forte
- [ ] **A08 — Data Integrity:** Validação de entrada e saída, CSP contra XSS
- [ ] **A09 — Logging Failures:** Logs estruturados sem dados PII, trilha de auditoria
- [ ] **A10 — SSRF:** Validação de URLs externas, blocklist de IPs internos

#### 3.4 — APIs e Infraestrutura
- [ ] Rate limiting implementado em todas as rotas públicas
- [ ] CORS configurado com whitelist explícita de origens (nunca `*`)
- [ ] Validação de Content-Type em todos os endpoints
- [ ] Proteção contra manipulação de preços em checkouts de assinatura
- [ ] Acesso a áreas Premium validado server-side, sem confiar em flags client-side

#### 3.5 — Supply Chain
- [ ] `npm audit` sem vulnerabilidades critical ou high
- [ ] Lock file commitado e atualizado
- [ ] Sem dependências abandonadas (último commit > 2 anos)

**Critério de conclusão:** Zero vulnerabilidades críticas/altas, RLS ativo, OWASP Top 10 coberto, npm audit limpo.

---

### Fase 4: Auditoria de Frontend e UX

| Atributo | Detalhe |
|----------|---------|
| **Agente** | UX/UI |
| **Skill** | `senior-frontend` |
| **Escopo** | `src/components/**`, `src/app/(app)/**`, hooks customizados |
| **Prioridade** | P1 — Experiência do usuário |

**Checklist:**
- [ ] CLS (Cumulative Layout Shift) < 0.1 em todas as páginas
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] Zero flickering em transições de página e carregamento de dados
- [ ] Glassmorphism consistente em todos os componentes (blur, opacidade, bordas)
- [ ] Framer Motion sem re-renders desnecessários (usar `layoutId`, `AnimatePresence` corretamente)
- [ ] Skeletons/loading states em todos os componentes que fazem fetch de dados
- [ ] Responsividade testada em mobile (375px), tablet (768px) e desktop (1280px+)
- [ ] Acessibilidade básica: `aria-labels`, foco visível, contraste WCAG AA

**Critério de conclusão:** Core Web Vitals dentro dos targets, zero flickering, design system consistente.

---

### Fase 5: Auditoria de Banco de Dados

| Atributo | Detalhe |
|----------|---------|
| **Agente** | Dados |
| **Skill** | `database-designer` |
| **Escopo** | `src/lib/db/schema/**`, queries, migrations |
| **Prioridade** | P1 — Performance e integridade |

**Checklist:**
- [ ] Índices otimizados para as queries mais frequentes (especialmente Forecast e Dashboard)
- [ ] Relações no Drizzle schema consistentes com foreign keys no banco
- [ ] Consistência no módulo de cartões de crédito (limites, faturas, parcelas)
- [ ] Queries N+1 eliminadas (usar joins ou batch queries)
- [ ] Migrations versionadas e reversíveis
- [ ] Soft-delete implementado onde necessário (registros financeiros nunca são deletados fisicamente)
- [ ] Valores monetários armazenados como integer (centavos)
- [ ] Todas as tabelas user-scoped possuem `userId` como foreign key

**Critério de conclusão:** Zero queries N+1, índices documentados, schema consistente com o banco.

---

### Fase 6: Auditoria de Escalabilidade e Infraestrutura

| Atributo | Detalhe |
|----------|---------|
| **Agentes** | Arquiteto + Backend |
| **Skills** | `senior-architect`, `senior-backend` |
| **Escopo** | Configurações de infra, caching, performance |
| **Prioridade** | P2 — Preparação para crescimento |

**Checklist:**
- [ ] `unstable_cache` ou cache nativo do Next.js configurado com tags de revalidação semânticas
- [ ] Neon configurado com connection pooling (não conexões diretas em produção)
- [ ] Rotas estáticas ou de baixa computação avaliadas para Edge Runtime
- [ ] Imagens otimizadas com `next/image` (WebP, lazy loading, sizes definidos)
- [ ] Bundle size analisado (`next/bundle-analyzer`) com chunks ótimos (< 250KB por rota)
- [ ] Sem imports dinâmicos desnecessários ou barrels que inflam o bundle

**Critério de conclusão:** Caching documentado, pooling ativo, bundle < 250KB/rota, Edge Runtime onde aplicável.

---

### Fase 7: Consolidação e Focused Fix

| Atributo | Detalhe |
|----------|---------|
| **Agente** | Execução |
| **Skill** | `focused-fix` |
| **Escopo** | Todos os achados das fases 1–6 |
| **Prioridade** | P0 — Resolução final |

**Regras de Execução:**
- [ ] Corrigir por ordem de severidade: P0 (crítico) → P1 (alto) → P2 (médio)
- [ ] Cada correção deve ser atômica: um commit lógico por fix, sem misturar escopo
- [ ] Nunca quebrar funcionalidades existentes (regressão zero)
- [ ] Manter TypeScript strict em 100% dos arquivos alterados
- [ ] Validar cada fix com `npm run build` e `npm run lint` após aplicação
- [ ] Documentar cada fix no formato `FIX-{NNN}` com referência ao achado original

**Critério de conclusão:** Todos os P0 resolvidos, build limpo, lint sem erros, relatório final gerado.

---

## 5. Matriz de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:------------:|:-------:|-----------|
| Ausência de RLS no Neon | Alta | Crítico | Implementar RLS na Fase 3, testar com usuários distintos |
| Segredos expostos no código | Média | Crítico | Scan automatizado na Fase 1, rotação imediata se encontrado |
| Regressão em refatoração | Alta | Alto | Cada fix validado com build + lint; commits atômicos |
| Dependências vulneráveis | Média | Alto | `npm audit` na Fase 1, atualização imediata de críticas |
| CLS alto por Framer Motion | Alta | Médio | Medição com Lighthouse na Fase 4, `layoutId` como padrão |
| Pooling incorreto no Neon | Média | Médio | Verificar connection string na Fase 6, testar sob carga |
| Skill inexistente no repositório | Média | Médio | Criar a skill seguindo template padrão antes de prosseguir |

---

## 6. Critérios de Sucesso

A auditoria só será considerada completa quando **todos** os critérios abaixo forem atingidos.

### 6.1. Entregáveis Obrigatórios

| Entregável | Formato | Conteúdo |
|------------|---------|----------|
| Relatório de Auditoria | Markdown | Achados por fase, severidade, status de correção |
| Código Limpo | Repositório | Zero erros de lint e TypeScript |
| Relatório de Segurança | Markdown | OWASP coverage, vulns encontradas/corrigidas |
| Métricas de UX | Lighthouse JSON | Core Web Vitals dentro dos targets |
| Skills criadas/atualizadas | SKILL.md | Todas as 8 skills existentes e documentadas |

### 6.2. Métricas de Aceitação

| Métrica | Target | Ferramenta |
|---------|:------:|------------|
| Erros de Lint | 0 | `npm run lint` |
| Erros de TypeScript | 0 | `npm run build` (tsc) |
| Vulnerabilidades Críticas | 0 | `npm audit` |
| Vulnerabilidades Altas | 0 | `npm audit` |
| CLS | < 0.1 | Lighthouse |
| LCP | < 2.5s | Lighthouse |
| FID | < 100ms | Lighthouse |
| Bundle por rota | < 250KB | `next/bundle-analyzer` |
| Cobertura OWASP Top 10 | 10/10 | Checklist manual + Red Team |
| Skills documentadas | 8/8 | Verificação de diretório |

---

## 7. Gestão de Skills

### 7.1. Quando criar uma skill

Se durante a auditoria um agente for invocado mas sua skill correspondente **não existir** no diretório `claude-skills/`, o agente deve:

1. **Pausar** a análise.
2. **Criar** o arquivo `SKILL.md` no caminho correto (ver tabela da seção 3.3).
3. **Seguir o template obrigatório** descrito abaixo.
4. **Retomar** a análise apenas após a skill estar criada e carregada.

### 7.2. Template obrigatório de SKILL.md

Toda skill deve conter, no mínimo, estas seções:

```markdown
# Skill: [Nome da Skill]

## Persona
[Descrição da persona técnica do agente]

## Escopo de Atuação
[Lista do que o agente cobre]

## Regras Invioláveis
1. **Nunca fuja da lógica do sistema multi-agente.** [+ regras específicas]
2. **Sempre leia o MASTER_AUDIT_PRD.md e AUDITORIA-FINANCEIRA.md** antes de iniciar.
3. **Sempre carregue esta skill** antes de analisar arquivos.
[... regras adicionais específicas da skill]

## Checklist de Análise
[Checklist específico do domínio]

## Output Esperado
[Formato padronizado de achados com prefixo do agente]

## Protocolo de Escalação
[Para quem delegar cada tipo de problema fora do escopo]
```

### 7.3. Regra de consistência

- Toda skill **deve** incluir como primeira regra inviolável: *"Nunca fuja da lógica do sistema multi-agente."*
- Toda skill **deve** referenciar este PRD e o `AUDITORIA-FINANCEIRA.md` como leitura obrigatória.
- Toda skill **deve** incluir um protocolo de escalação que mapeia problemas fora de escopo para o agente correto.

---

## 8. Glossário

| Termo | Definição |
|-------|-----------|
| **RLS** | Row Level Security — isolamento de dados por usuário no banco de dados |
| **CLS** | Cumulative Layout Shift — métrica de estabilidade visual |
| **LCP** | Largest Contentful Paint — métrica de velocidade de carregamento |
| **FID** | First Input Delay — métrica de interatividade |
| **OWASP** | Open Web Application Security Project — padrão de segurança web |
| **P0/P1/P2** | Níveis de prioridade: Crítico / Alto / Médio |
| **Focused Fix** | Correção cirúrgica e atômica de um débito técnico específico |
| **Edge Runtime** | Execução em CDN distribuída para menor latência |
| **IDOR** | Insecure Direct Object Reference — acesso não autorizado via manipulação de IDs |
| **RLS Policy** | Regra SQL que restringe acesso a linhas baseado no contexto do usuário |
| **Idempotency Key** | Token que garante que uma operação é executada apenas uma vez |
| **Soft-delete** | Marcação de registro como deletado sem remoção física do banco |

---

> **⚠️ INSTRUÇÃO FINAL PARA O AGENTE:**
>
> 1. SEMPRE leia o arquivo `AUDITORIA-FINANCEIRA.md` na raiz antes de começar para não repetir trabalhos já realizados.
> 2. SEMPRE carregue a skill correspondente ao seu papel antes de analisar qualquer arquivo.
> 3. NUNCA fuja da lógica do sistema multi-agente — documente e delegue.
> 4. Se uma skill não existir, CRIE-A seguindo o template da seção 7.2 antes de prosseguir.

---

*Fim do Documento — DUD.IA Finance v2 — PRD Auditoria 360° v2.0*
