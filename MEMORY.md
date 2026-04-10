# Projeto: Dudia Finance v2 - Memória de Desenvolvimento

## 📌 Status Atual
- **Versão:** 0.3.0
- **Fase:** Migração para Clerk & Portal de Acesso Direto (Em andamento).
- **Story Ativa:** [STORY-003] Migração de Autenticação e Simplificação de Infraestrutura.

## 🛠️ Decisões Técnicas
- **2026-04-09:** Substituído NextAuth pelo **Clerk v7** para simplificar e-mails transacionais e gestão de usuários.
- **Transição de ID:** Decidido manter UUID local como chave primária e mapear `clerkId` na tabela de usuários para preservar integridade dos dados existentes.
- **Simplificação de Stack:** Remoção do Redis (Upstash) e Brevo (E-mail) para reduzir custos e complexidade.
- **UX Resiliente:** Home page refatorada para carregar interface instantaneamente (Zinc Theme) enquanto o estado de auth resolve em background.

## 🚀 Próximos Passos (Retomada)
1. Validar login bem-sucedido e criação de usuário via Webhook.
2. Finalizar refatoração do helper `getUserId` para usar tradução de IDs Clerk -> Local.
3. Purga final de pacotes e arquivos legados (`next-auth`, `upstash`, `nodemailer`).

## 📝 Notas de Auditoria
- O sistema possui um mecanismo de "Self-Healing" em `financial-engine.ts`.
- Auditoria nativa em `audit_logs` para todas as operações financeiras.
