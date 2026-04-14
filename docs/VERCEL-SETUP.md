# Vercel KV (Upstash Redis) Setup Guide

## 1. Create a Vercel KV Database

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Create Database**
3. Select **KV (Upstash Redis)** — Free tier available
4. Choose a region closest to your deployment (e.g., `São Paulo` for Brazil)
5. Click **Create**

## 2. Connect to Your Project

1. In the KV database dashboard, click **Connect to existing project** or select your project from the dropdown
2. Copy the connection string (looks like `redis://default:xxxx@host:port`)

## 3. Configure Environment Variables

### Option A: Via Vercel Dashboard
1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

| Name | Value | Environments |
|------|-------|--------------|
| `KV_URL` | `kv://<your-kv-instance-id>` | Production, Preview, Development |
| `KV_REST_API_TOKEN` | `<your-rest-api-token>` | Production, Preview, Development |

### Option B: Via CLI
```bash
vercel env add KV_URL
vercel env add KV_REST_API_TOKEN
```

### Getting KV_URL and KV_REST_API_TOKEN
From your KV database page:
- **KV_URL**: Found under **Quickstart** or **Connection** — format: `kv://cluster.xxxx`
- **KV_REST_API_TOKEN**: Under **API Token** → **Create Token** (copy immediately, shown only once)

## 4. Verify Rate Limiting Works

### Local Testing
1. Ensure `.env.local` has your KV credentials (copy from Vercel dashboard)
2. Run the app: `npm run dev`
3. Trigger rate-limited requests (e.g., rapid auth calls)
4. Check logs — you should see `[RateLimit]` messages

### Production Testing
```bash
vercel deploy --prod
```
Then make rapid requests to your production URL and verify 429 responses after the limit.

## 5. Monitor KV Usage

### Vercel Dashboard
- **Storage** → Select your KV database → **Metrics**
- View: Requests, Latency, Memory usage

### Upstash Dashboard
1. Click **Open Upstash Dashboard** in your KV database page
2. Monitor:
   - **Requests**: Total KV operations
   - **Commands**: Breakdown by operation type (GET, SET, etc.)
   - **Memory**: Usage vs plan limit

### Alerts
Set up alerts in Upstash dashboard for:
- Memory approaching plan limit
- Unusual request spikes
- High latency

## 6. Troubleshooting

### "Redis unavailable" in logs
- Verify `KV_URL` and `KV_REST_API_TOKEN` are set correctly
- Check KV database is not paused (free tier auto-pauses after 7 days of inactivity)
- Ensure Vercel project is connected to the KV database

### Rate limiting not working
- Check middleware is deployed: `vercel deploy --prod`
- Verify environment variables are set for Production environment
- Test with incognito window to avoid browser caching

### Free Tier Limits
- Upstash Redis Free: 10,000 commands/day, 256 MB memory
- If exceeded, rate limiting fails open (requests allowed)
- Monitor daily usage in Upstash dashboard

## Rate Limit Configuration

Edit `src/lib/rate-limit.ts` to adjust limits:

```typescript
const RATE_LIMITS = {
  auth: { windowMs: 60_000, maxRequests: 10 },   // 10 req/min for auth
  write: { windowMs: 60_000, maxRequests: 100 },  // 100 req/min for writes
  read: { windowMs: 60_000, maxRequests: 100 },  // 100 req/min for reads
};
```

## Local Development Without KV

If KV is unavailable locally, the system **fails open** — requests are allowed. This is intentional to prevent blocking development.

To test rate limiting locally:
```bash
# Install Upstash CLI or use a local Redis
# Or use the Vercel CLI to link the KV:
vercel link
vercel env pull
```
