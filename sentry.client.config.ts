import * as Sentry from "@sentry/nextjs";

const IGNORED_ERRORS = [
  "ValidationError",
  "AuthError",
  "NetworkError",
  "AbortError",
  "ECONNREFUSED",
];

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1,

  debug: false,

  replaysOnErrorSampleRate: 1.0,

  replaysSessionSampleRate: 0.1,

  ignoreErrors: IGNORED_ERRORS,

  beforeSend(event) {
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value || "";
      if (IGNORED_ERRORS.some((err) => errorMessage.includes(err))) {
        return null;
      }
    }

    if (event.message) {
      const msg = event.message;
      if (msg.includes("transaction.cron.failed")) {
        event.fingerprint = ["transaction-cron-failed"];
        event.level = "warning";
      }
      if (msg.includes("account.balance.negative")) {
        event.fingerprint = ["account-balance-negative"];
        event.level = "warning";
      }
    }

    return event;
  },
});