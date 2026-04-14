const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (!isProd) console.log(`[INFO] ${message}`, meta ?? '');
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (!isProd) console.warn(`[WARN] ${message}`, meta ?? '');
  },
  error: (message: string, error?: unknown) => {
    if (isProd) {
      console.error(`[ERROR] ${message}`, error instanceof Error ? error.message : error);
    } else {
      console.error(`[ERROR] ${message}`, error);
    }
  },
};
