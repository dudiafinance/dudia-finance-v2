import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'deepseek/deepseek-chat:free',
  'meta-llama/llama-3.1-70b-instruct:free',
  'qwen/qwen-2-7b-instruct:free',
];

export async function generatePills(context: string) {
  let lastError = null;

  for (const model of FREE_MODELS) {
    try {
      console.log(`[AI Router] Attempting with model: ${model}`);
      const { text } = await generateText({
        model: openrouter(model),
        system: `Você é um Engenheiro Financeiro de alta precisão. 
        Analise os dados JSON do usuário e retorne EXATAMENTE 3 insights (pílulas) curtos e práticos em Português.
        Cada pílula deve ter no máximo 15 palavras.
        Responda APENAS no formato JSON: 
        [
          {"title": "Título Curto", "content": "Conteúdo direto", "type": "warning" | "info" | "success"},
          ...
        ]`,
        prompt: `Dados Financeiros: ${context}`,
      });

      // Validar se é um JSON válido
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error(`[AI Router] Failed with ${model}:`, error);
      lastError = error;
      continue; // Tenta o próximo modelo
    }
  }

  throw lastError || new Error("Todos os modelos de IA falharam.");
}