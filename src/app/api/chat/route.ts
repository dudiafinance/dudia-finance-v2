import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getFinancialSummary, getSpendingByCategory, checkHealth } from '@/lib/ai/tools';
import { getUserId } from '@/lib/auth-utils';
import * as schema from '@/lib/db/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/utils/encryption';

export const maxDuration = 30;

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  // Buscar chave do usuário ou global
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { openRouterApiKey: true }
  });
  const apiKey = user?.openRouterApiKey ? decrypt(user.openRouterApiKey) : process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('No API Key found for user', userId);
    return new Response('Configuração de IA ausente. Vá em Configurações > API e vincule sua chave do OpenRouter.', { status: 400 });
  }

  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
  });

  const { messages } = await req.json();

  const result = streamText({
    model: openrouter('google/gemma-4-26b-a4b-it:free'),
    system: `Você é o DUD.IA, um Engenheiro Financeiro de alta precisão.
    Sua personalidade: Direto, técnico, prestativo e analítico.
    Você não apenas responde perguntas, você audita o patrimônio do usuário.
    Utilize as ferramentas disponíveis para consultar dados reais. Nunca invente valores.
    Responda sempre em Português do Brasil.
    Use Markdown para formatar tabelas e destacar valores monetários.
    TRAVAS DE SEGURANÇA:
    - Você SÓ tem acesso aos dados do sistema vinculado ao ID do usuário atual.
    - Você NÃO pode pesquisar na internet.
    - Você NÃO pode acessar dados de outros usuários.
    - Se o usuário pedir algo fora do escopo financeiro do sistema dele, recuse educadamente.`,
    messages,
    tools: {
      getFinancialSummary,
      getSpendingByCategory,
      checkHealth
    },
    // Roteamento automático de fallback poderia ser adicionado aqui em um wrapper
  });

  return result.toTextStreamResponse();
}