import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

export function register() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        Sentry.captureConsoleIntegration({
          levels: ['error', 'warn'],
        }),
      ],
    })
  }
}

export const SentryLogger = {
  captureException: (error: Error, context?: Record<string, unknown>) => {
    if (SENTRY_DSN) {
      Sentry.captureException(error, { extra: context })
    }
    console.error('[ERROR]', error.message, context)
  },

  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) => {
    if (SENTRY_DSN) {
      Sentry.captureMessage(message, { level, extra: context })
    }
    console.log(`[${level.toUpperCase()}]`, message, context)
  },

  setContext: (name: string, context: Record<string, unknown>) => {
    if (SENTRY_DSN) {
      Sentry.setContext(name, context)
    }
  },

  setUser: (user: { id: string; email?: string }) => {
    if (SENTRY_DSN) {
      Sentry.setUser(user)
    }
  },
}