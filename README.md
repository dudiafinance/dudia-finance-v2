# DUD.IA Finance V2

Sistema de controle financeiro pessoal criado do zero em 05/04/2026.

## 📍 Localização

```
C:\Users\EDUZZ3215\Documents\Projetos\dudia-finance-v2
```

## 🚀 Quick Start

```bash
# Entrar na pasta
cd C:\Users\EDUZZ3215\Documents\Projetos\dudia-finance-v2

# Instalar dependências
npm install

# Gerar banco de dados
npm run db:generate
npm run db:push

# Iniciar projeto
npm run dev
```

## 📚 Documentação

O projeto utiliza uma estrutura organizada. Veja a pasta [/docs](file:///c:/Users/EDUZZ3215/Documents/Projetos/dudia-finance-v2/docs) para detalhes técnicos:
- [Relatórios do Sistema](file:///c:/Users/EDUZZ3215/Documents/Projetos/dudia-finance-v2/docs/SYSTEM_REPORTS.md)
- [Histórico de Mudanças](file:///c:/Users/EDUZZ3215/Documents/Projetos/dudia-finance-v2/docs/CHANGES.md)
- [Guia de Migração](file:///c:/Users/EDUZZ3215/Documents/Projetos/dudia-finance-v2/docs/MIGRATION-GUIDE.md)

## 🔧 Tecnologias

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui
- **Backend/DB**: Drizzle ORM, PostgreSQL (Neon), Next-Auth v5
- **Estado**: Zustand, React Query
- **Utilitários**: Lucide React, Recharts, Zod

## 📋 Credenciais

Todas as credenciais estão em `.env.local` (NÃO COMMITAR para git). Veja `.env.example` para as variáveis necessárias.

## 📦 Scripts Disponíveis

```bash
npm run dev           # Rodar ambiente de desenvolvimento
npm run build         # Gerar build de produção
npm run start         # Iniciar servidor de produção
npm run lint          # Verificar erros de código
npm run db:generate   # Gerar arquivos de migração
npm run db:migrate    # Aplicar migrações ao banco
npm run db:push       # Sincronizar schema sem migrações
npm run db:studio     # Interface visual para o banco
```

## ✅ Status Atual

- [x] Arquitetura Next.js 15+ configurada
- [x] Design System com Tailwind v4 e shadcn
- [x] Autenticação com Next-Auth v5
- [x] Motor Financeiro (Transações, Cartões, Contas)
- [x] Banco de Dados (Drizzle + Neon)
- [x] Estrutura de Pastas Organizada (Clean Root)

---

**Desenvolvido com 💜**