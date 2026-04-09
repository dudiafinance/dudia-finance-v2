import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('Configurações do Upstash Redis não encontradas no .env. O cache será desativado.');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

/**
 * Helper para buscar dados do cache ou executar a função e salvar no cache.
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300 // 5 minutos por padrão
): Promise<T> {
  // Se não houver configuração do Redis, apenas executa a função
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return fetchFn();
  }

  try {
    const cachedData = await redis.get<T>(key);
    if (cachedData) {
      return cachedData;
    }

    const freshData = await fetchFn();
    await redis.set(key, freshData, { ex: ttlSeconds });
    return freshData;
  } catch (error) {
    console.error(`Erro no cache (Key: ${key}):`, error);
    return fetchFn(); // Fallback para dados frescos se o Redis falhar
  }
}

/**
 * Helper para invalidar cache de um usuário específico.
 */
export async function invalidateUserCache(userId: string, prefix: string = 'dashboard') {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  
  try {
    const key = `${prefix}:${userId}:*`;
    // Nota: Em implementações reais com Upstash, idealmente usaríamos SCAN ou tags.
    // Para simplificar agora, focaremos na chave principal do dashboard.
    await redis.del(`${prefix}:${userId}`);
  } catch (error) {
    console.error(`Erro ao invalidar cache (User: ${userId}):`, error);
  }
}
