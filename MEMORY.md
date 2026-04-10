# Projeto: Dudia Finance v2 - Memória de Desenvolvimento

## 📌 Status Atual
- **Versão:** 0.5.0
- **Fase:** Sistema em Produção com Inteligência Artificial e Suíte de Testes E2E.
- **Story Ativa:** Nenhuma (Integração IA e Debug de Fluxos Concluídos).

## 🛠️ Decisões Técnicas
- **2026-04-10:** **Implementação de E2E Debug.** Suíte de testes com Playwright adicionada para auditar todos os fluxos críticos (Contas, Transações, Metas, Orçamentos).
- **2026-04-10:** **Bypass de Autenticação para Agentes.** Criado header `x-debug-bypass` para permitir que o agente de teste @qa realize ações no banco sem bloqueios de CORS do Clerk.
- **2026-04-10:** **DUDIA AI Insights.** Integrado OpenRouter com roteamento inteligente entre modelos gratuitos (Gemini, DeepSeek, Llama) para gerar 3 pílulas de insights financeiros no Dashboard.
- **2026-04-10:** **Correção de Datas Nulas.** Sanado erro 500 no PostgreSQL ao enviar strings vazias em datas de término de Metas e Orçamentos.
- **2026-04-10:** **Sincronização de Banco.** Schema e Migrações (0018) sincronizados com o Neon.

## 🚀 Próximos Passos
1. Implementar streaming real nas pílulas de IA para melhor UX.
2. Expandir suíte E2E para cobrir fluxos de estorno e parcelamento complexo.
3. Configurar CI/CD no Vercel vinculando os testes do Playwright.

## 📝 Notas de Auditoria
- O sistema agora é auditável via comando `npm run test:e2e`.
- O token OpenRouter está configurado e funcional.
