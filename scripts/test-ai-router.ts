import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const FREE_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3.6-plus',
  'z-ai/glm-5.1',
];

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error('❌ OPENROUTER_API_KEY not found in environment');
  process.exit(1);
}

console.log('=== Testing AI Router directly ===\n');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

const context = JSON.stringify({
  totalBalance: 5000,
  monthlyIncome: 8000,
  monthlyExpense: 3000,
  cardInvoice: 1500,
  activeGoals: [{ name: "Emergency Fund", current: 2000, target: 10000 }],
  activeBudgets: [{ name: "Food", limit: 500 }]
});

async function testGeneratePills() {
  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
  });

  let lastError = null;

  for (const model of FREE_MODELS) {
    try {
      console.log(`\n📡 Trying model: ${model}`);
      
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

      console.log('✅ Success! Raw response:');
      console.log(text);

      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const pills = JSON.parse(cleanedText);
      
      console.log('\n📊 Parsed pills:');
      console.log(JSON.stringify(pills, null, 2));
      
      return pills;
    } catch (error) {
      console.error(`❌ Failed with ${model}:`, error instanceof Error ? error.message : error);
      lastError = error;
      continue;
    }
  }

  console.error('\n💥 All models failed!');
  throw lastError;
}

testGeneratePills()
  .then(() => {
    console.log('\n\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n\n❌ Test failed:', error);
    process.exit(1);
  });