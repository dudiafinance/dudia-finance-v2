---
description: Padrão oficial para finalização de funcionalidades (Commit + DB + Deploy)
---

Sempre que uma funcionalidade for concluída ou modificada, siga rigorosamente estes passos antes de entregar ao usuário:

1. **Verificação de Banco de Dados**:
   - Execute `npm run db:generate` para verificar se houve mudanças no schema.
   - Caso haja mudanças, execute `npm run db:push` ou `npm run db:migrate` para sincronizar o banco.

2. **Commit Limpo e Atualizado**:
   - Use `git status` para garantir que apenas os arquivos necessários estão sendo commitados.
   - Utilize o padrão Conventional Commits (ex: `feat:`, `fix:`, `refactor:`).
   - Realize o `git push origin [branch]`.

3. **Deploy em Produção**:
// turbo
   - Execute `vercel --prod` para garantir que as alterações estão refletidas no ambiente oficial do projeto.

4. **Relatório Final**:
   - Informe ao usuário que o código foi commitado, o banco está sincronizado e o deploy foi realizado com sucesso.
