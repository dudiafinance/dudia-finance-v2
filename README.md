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

Veja o arquivo `HISTORICO_DESENVOLVIMENTO.md` para o histórico completo da conversa e desenvolvimento.

## 🔧 Tecnologias

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM
- PostgreSQL (Neon)
- NextAuth v5
- OpenRouter API
- SendGrid
- Zustand
- Recharts

## 📋 Credenciais

Todas as credenciais estão em `.env.local` (NÃO COMMITAR para git).

## 📦 Scripts Disponíveis

```bash
npm run dev        # Desenvolvimento
npm run build     # Build produção
npm run start     # Iniciar produção
npm run lint      # Verificar código
npm run db:generate   # Gerar migrations
npm run db:migrate   # Executar migrations
npm run db:push     # Push schema para banco
npm run db:studio  # Abrir Drizzle Studio
```

## ✅ Status

- [x] Projeto Base Next.js 16
- [x] shadcn/ui
- [x] Dependências instaladas
- [x] .env.local configurado
- [x] Schema Drizzle (8 tabelas)
- [x] Estrutura de pastas

**Pendente:**
- [ ] Gerar/migrar banco
- [ ] Configurar NextAuth
- [ ] Criar APIs
- [ ] Criar frontend
- [ ] Testes
- [ ] Deploy

---

**Desenvolvido com 💜**