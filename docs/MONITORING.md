# Monitoring & Alerts

## Sentry Configuration

### Environment Variables

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project
```

### Configuration Files

- `sentry.client.config.ts` - Client-side monitoring
- `sentry.server.config.ts` - Server-side monitoring
- `sentry.edge.config.ts` - Edge functions monitoring

---

## Sentry Alerts Setup

### Alert: Transaction Cron Failed

Triggered when a scheduled transaction fails.

**Event Tag:** `transaction.cron.failed`

**Setup in Sentry Dashboard:**
1. Go to **Alerts** → **Create Alert**
2. Select **Issue** type
3. Filter: `message:"transaction.cron.failed"`
4. Set frequency: `5 minutes`
5. Configure notification channel

---

### Alert: Account Balance Negative (>24h)

Triggered when an account balance remains negative for more than 24 hours.

**Event Tag:** `account.balance.negative`

**Setup in Sentry Dashboard:**
1. Go to **Alerts** → **Create Alert**
2. Select **Issue** type
3. Filter: `message:"account.balance.negative"`
4. Set **Time Range**: `24 hours`
5. Configure notification channel

---

## Ignore Expected Errors

The following errors are ignored by default:

- `ValidationError` - Form validation failures
- `AuthError` - Authentication issues
- `NetworkError` - Network connectivity issues
- `AbortError` - Request aborts
- `ECONNREFUSED` - Connection refused

---

## Capturing Custom Events

```typescript
import * as Sentry from "@sentry/nextjs";

// Cron failure
Sentry.captureMessage("transaction.cron.failed", "warning");

// Negative balance
Sentry.captureMessage("account.balance.negative", "warning");
```

---

## Useful Links

- [Sentry Documentation](https://docs.sentry.io)
- [Alert Configuration](https://docs.sentry.io/product/alerts/)
- [Sentry SDK Config](https://docs.sentry.io/platforms/javascript/configuration/)
