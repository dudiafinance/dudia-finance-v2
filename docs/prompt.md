# Prompt de Auditoria Sistêmica e Engenharia de Inteligência (DUD.IA Finance V2)

**Objetivo:** Realizar um "Deep Dive" técnico e funcional em todo o repositório `dudia-finance-v2`, identificando a estrutura atual, falhas de lógica, gargalos de performance e brechas de segurança, enquanto se estabelece uma infraestrutura de agentes e skills para evolução contínua do projeto.

---

### Fase 1: Mapeamento e Infraestrutura de Agentes
1.  **Escaneamento de Inteligência:** Verifique a existência de pastas como `.agents`, `_agents`, `skills` ou `workflows`.
    *   Se existirem, categorize cada agente/skill por sua função (Backend, UX, DB, Segurança).
    *   Se não existirem, crie uma estrutura base (`.agents/workflows` e `.agents/skills`) para hospedar a inteligência do projeto.
2.  **Criação de Agentes Especialistas (Baseado em Skills):** Configure perfis de atuação para:
    *   **Auditor de Código:** Focado em Clean Code, SOLID e DRY em TypeScript/Next.js.
    *   **Engenheiro de Lógica Financeira:** Focado nas regras de transações, cartões e previsões.
    *   **Pentester de Aplicação:** Focado em segurança de rotas, middleware e validação de dados (Zod).
    *   **Arquiteto de Banco de Dados:** Focado em otimização de queries Drizzle-ORM e integridade do PostgreSQL/Neon.
    *   **Estrategista de Performance:** Focado em Core Web Vitals, cache do React Query e renderização do Next.js.

### Fase 2: Varredura Linha a Linha (Audit Mode)
Execute uma análise exaustiva em todos os diretórios (`src/app`, `src/lib`, `src/hooks`, `src/components`) focando em:
*   **Lógica & Regras de Negócio:** As funções de cálculo de fatura e saldo estão blindadas? Existem casos de borda (edge cases) não tratados?
*   **Segurança:** Há vazamento de informações em logs? As sessões estão sendo checadas em todas as rotas `api` e `server components`?
*   **Banco de Dados:** Existem N+1 queries? As migrações estão consistentes com o schema atual?
*   **Performance:** Há re-renders desnecessários no frontend ou chamadas de API redundantes?

### Fase 3: Geração do Documento Mestre de Inteligência
Gere um artefato final chamado `SYSTEM_REPORTS.md` contendo:
1.  **Estatus Quo:** O que o sistema faz hoje, quais tecnologias usa e como a arquitetura está organizada.
2.  **Mapa de Vulnerabilidades:** Lista de riscos (Segurança/Performance/Lógica) classificados por severidade (Baixa, Média, Alta).
3.  **Plano de Evolução (Roadmap):** 
    *   Melhorias imediatas (Quick Wins).
    *   Refatorações estruturais necessárias.
    *   Sugestão de novas funcionalidades para tornar o sistema "State-of-the-Art".
4.  **Guia de Agentes:** Como os novos agentes criados devem ser acionados para manter o sistema saudável daqui para frente.

---

**Instrução de Execução:** "Não pule nenhum arquivo. Use ferramentas de busca global e leitura de arquivos para garantir que 100% do código seja auditado. Priorize a qualidade técnica sobre a velocidade."
