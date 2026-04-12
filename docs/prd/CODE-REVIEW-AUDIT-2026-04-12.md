# PRD — Code Review & System Audit Report
**Product:** DUD.IA Finance v2  
**Date:** 2026-04-12  
**Reviewer:** Morgan (PM) + Explore Agent  
**Scope:** Full system audit — 670 source files, all API routes, financial engine, schema, validations, components, tests  
**Test Account:** igorpminacio@hotmail.com  

---

## Executive Summary

The system is architecturally sound with a clear separation of concerns (FinancialEngine, Drizzle ORM, Clerk auth, Next.js App Router). All 84 unit tests pass. However, **12 critical/high-severity bugs** were found that directly affect financial data integrity, security, and correctness. The most severe issue is that the **idempotency system is fully implemented but never used** in any financial endpoint, meaning network retries create duplicate transactions. Additionally, there is a **logic inversion bug in idempotency cleanup** that deletes the WRONG records.

---

## 1. CRITICAL BUGS (Severity: P0)

### BUG-001 — Idempotency Cleanup Deletes RECENT Records (CRITICAL LOGIC INVERSION)
**File:** `src/lib/idempotency.ts`, line 108  
**Current code:**
```typescript
const result = await db.delete(idempotencyKeys)
  .where(gt(idempotencyKeys.createdAt, cutoff))  // ← BUG: gt = greater than = deletes RECENT keys
```
**Problem:** `gt` (greater than) means "delete records NEWER than the cutoff". This is inverted — it deletes valid, active keys instead of stale ones. The entire idempotency protection is negated whenever the cron runs cleanup.  
**Fix:** Change `gt` → `lt`:
```typescript
.where(lt(idempotencyKeys.createdAt, cutoff))
```

---

### BUG-002 — Idempotency System Implemented but NEVER Used
**File:** All financial API endpoints (transactions, transfers, goal deposits, invoice payments)  
**Problem:** `src/lib/idempotency.ts` exports `checkIdempotencyKey`, `storeIdempotencyKey`, and `getIdempotencyKey`, but NONE of the financial API routes call these functions. A user double-clicking "Save" or a mobile network retry creates **duplicate transactions** with no protection.  
**Impact:** Financial data corruption (duplicate debits/credits)  
**Fix:** Add idempotency middleware to these routes:
- `POST /api/transactions`
- `POST /api/transfers`
- `POST /api/goals/deposit`
- `POST /api/credit-cards/pay-invoice`
- `POST /api/credit-cards/[id]/transactions`

Pattern to apply:
```typescript
const idempotencyKey = getIdempotencyKey(req);
if (idempotencyKey) {
  const cached = await checkIdempotencyKey(idempotencyKey, userId);
  if (cached) return NextResponse.json(cached.body, { status: cached.status });
}
// ... create transaction ...
if (idempotencyKey) {
  await storeIdempotencyKey(idempotencyKey, userId, { status: 201, body: result });
}
```

---

### BUG-003 — Transfer Does NOT Validate Destination Account Ownership
**File:** `src/lib/services/financial-engine.ts`, lines 167–222  
**Problem:** `transferFunds()` validates `fromAccountId` ownership (line 168–180), but `toAccountId` is **never verified**. An attacker who discovers another user's account UUID can execute:
```
POST /api/transfers { fromAccountId: "mine", toAccountId: "victim-uuid", amount: "1000" }
```
This creates an `income` transaction in the victim's account, inflating their balance with no authorization.  
**Fix:** Add destination account query before insert:
```typescript
const [toAccount] = await tx.select().from(accounts)
  .where(and(eq(accounts.id, data.toAccountId), eq(accounts.userId, data.userId), isNull(accounts.deletedAt)))
  .limit(1);
if (!toAccount) throw FinancialError.notFound("Conta de destino");
```

---

### BUG-004 — Goal Deposit Does NOT Cap at Target Amount
**File:** `src/lib/services/financial-engine.ts`, lines ~430–440  
**Problem:** When depositing to a goal, no validation checks that `currentAmount + depositAmount <= targetAmount`. Users can over-deposit past the goal target, making `currentAmount > targetAmount`, which breaks progress percentage calculations (>100%).  
**Fix:** Add guard before update:
```typescript
const newAmount = Number(goal.currentAmount) + Number(data.amount);
if (goal.targetAmount && newAmount > Number(goal.targetAmount)) {
  throw new Error(`Depósito ultrapassa a meta. Máximo permitido: ${Number(goal.targetAmount) - Number(goal.currentAmount)}`);
}
```

---

### BUG-005 — Goal `currentAmount` Update NOT Atomic (Race Condition)
**File:** `src/lib/services/financial-engine.ts`, goal deposit logic  
**Problem:** The code reads `goal.currentAmount`, adds the deposit locally, then writes back. Two concurrent deposits can both read the same base value and overwrite each other:
- Thread A reads `currentAmount = 500`, adds 100 → writes 600
- Thread B reads `currentAmount = 500` (before A writes), adds 200 → writes 700
- Final value: 700, but should be 800 (lost 100)

**Fix:** Use SQL-level atomic update:
```typescript
await tx.update(goals).set({
  currentAmount: sql`${goals.currentAmount} + ${data.amount}`,
  updatedAt: new Date()
}).where(eq(goals.id, data.goalId));
```

---

### BUG-006 — Encryption Fallback Silently Returns Plaintext on Failure
**File:** `src/lib/utils/encryption.ts`, line 37  
**Current code:**
```typescript
} catch (error) {
  console.error('Falha na descriptografia:', error);
  return text; // Fallback para o original se falhar
}
```
**Problem:** If decryption fails (wrong key, corrupted data), the function returns the ciphertext as-is. Callers assume they received plaintext but actually receive the raw encrypted hex string. This silently corrupts UI data without any error propagation.  
**Fix:** Throw a typed error:
```typescript
throw new Error('DECRYPTION_FAILED: Chave inválida ou dado corrompido');
```
The callers should handle this gracefully with a dedicated error boundary.

---

### BUG-007 — Default Encryption Key Exposed in Code
**File:** `src/lib/utils/encryption.ts`, line 3  
**Current code:**
```typescript
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'default-secret-key-32-chars-long').slice(0, 32).padEnd(32, '0');
```
**Problem:** If `ENCRYPTION_KEY` env var is not set (staging, local dev, missed deployment), the system silently uses a hardcoded key that is visible in the git history. Any data encrypted with this key is trivially decryptable by anyone with git access.  
**Fix:** Remove the default entirely:
```typescript
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY_RAW || ENCRYPTION_KEY_RAW.length < 32) {
  throw new Error('ENCRYPTION_KEY env var missing or too short (minimum 32 chars)');
}
const ENCRYPTION_KEY = ENCRYPTION_KEY_RAW.slice(0, 32);
```

---

### BUG-008 — Debug Bypass Bypasses All Security for Hardcoded UUID
**File:** `src/lib/auth-utils.ts`, lines 13–17  
**Current code:**
```typescript
if (h.get("x-debug-bypass") === process.env.AIOX_DEBUG_TOKEN && process.env.AIOX_DEBUG_TOKEN) {
  return "debfc4b5-45eb-45dc-90d3-30a83d4e1064"; // Igor Massaro
}
```
**Problem:** If `AIOX_DEBUG_TOKEN` is set in production (and it is, per code comments), anyone who discovers the token can access ALL financial data of user `debfc4b5-45eb-45dc-90d3-30a83d4e1064` (Igor Minácio / igorpminacio@hotmail.com). This includes full transaction history, balances, goals, and credit card data.  
**Fix:** Restrict to `NODE_ENV !== 'production'`:
```typescript
if (process.env.NODE_ENV !== 'production' && 
    h.get("x-debug-bypass") === process.env.AIOX_DEBUG_TOKEN && 
    process.env.AIOX_DEBUG_TOKEN) {
  return "debfc4b5-45eb-45dc-90d3-30a83d4e1064";
}
```

---

## 2. HIGH-SEVERITY BUGS (Severity: P1)

### BUG-009 — Card Limit Inflated by Future Months' Transactions
**File:** `src/lib/services/financial-engine.ts`, lines 225–253  
**Problem:** `recalculateCardLimit()` sums ALL unpaid card transactions regardless of month/year. This includes transactions from future months (e.g., installments for Dec 2027), counting them against today's available limit.  
**Example:** User has R$5,000 limit. They add a 12-month installment of R$500/month. Total tracked = R$6,000. Limit shows as fully exceeded even though only R$500 is due this month.  
**Fix:** Filter to current + past months only:
```sql
AND (invoiceYear < currentYear OR (invoiceYear = currentYear AND invoiceMonth <= currentMonth))
```

---

### BUG-010 — Installment Calculation Last Installment May Differ from Displayed
**File:** `src/app/api/credit-cards/[id]/transactions/route.ts`, lines 98–107  
**Current code:**
```typescript
const amountInCents = Math.round(amount * 100);
const baseCents = Math.floor(amountInCents / n);
const remainderCents = amountInCents - baseCents * (n - 1);
```
**Problem:** The remainder is assigned to the LAST installment (`i === n`), but the loop variable `i` starts at `startInstallment`. If `startInstallment > 1` (partial purchase), the last installment index is `n`, not necessarily the actual last one in the loop. This can place the remainder at the wrong installment or miss it entirely.  
**Fix:** Use modulo remainder on the first installment of the batch:
```typescript
const remainderCents = amountInCents % n;
// Add remainder to first installment (i === start)
const installmentCents = i === start ? baseCents + remainderCents : baseCents;
```

---

### BUG-011 — Forecast Route Loads ALL Transactions Without Date Filter
**File:** `src/app/api/forecast/route.ts`, lines 29–41  
**Problem:** Fetches the complete transaction history without any date range filter. For a user with 5 years of data (potentially thousands of records), this can cause:
- Response times >30s (Vercel 25s timeout = 504 error)
- OOM errors in serverless function
- Wasted bandwidth

**Fix:** Add a reasonable lookback window (e.g., 12 months for trend analysis):
```typescript
const lookbackDate = new Date(currentYear - 1, currentMonth - 1, 1).toISOString().split('T')[0];
.where(and(
  eq(transactions.userId, userId), 
  isNull(transactions.deletedAt),
  gte(transactions.date, lookbackDate)
))
```

---

### BUG-012 — Budget Alert Threshold Minimum 50 is Arbitrary and Blocks Valid Use
**File:** `src/lib/validations/index.ts`, line 62  
**Current code:**
```typescript
alertThreshold: z.coerce.number().min(50).max(100).default(80),
```
**Problem:** Users cannot set budget alerts below 50%. Valid use case: a user who wants to be alerted at 25% spent (e.g., for strict expense control). No technical reason prevents lower thresholds.  
**Fix:** Change to `min(1).max(100)`.

---

### BUG-013 — Deleted Account Can Be Updated via PUT
**File:** `src/app/api/accounts/[id]/route.ts`, PUT handler  
**Problem:** The update WHERE clause does not check `isNull(accounts.deletedAt)`. A soft-deleted account can be modified via direct API call.  
**Fix:** Add `isNull(accounts.deletedAt)` to the update WHERE condition.

---

### BUG-014 — Goal Contribution Allows Zero Amount
**File:** `src/lib/validations/index.ts`, line 137  
**Current code:**
```typescript
amount: z.coerce.number().min(0, "Valor deve ser maior ou igual a zero"),
```
**Problem:** Allows `amount = 0`, creating meaningless contribution records that pollute the goal history and distort average contribution calculations.  
**Fix:** Change to `.positive()` or `.gt(0)`.

---

### BUG-015 — Date Fields Accept Invalid String Format
**File:** `src/lib/validations/index.ts`, lines 42, 59, 75, 93  
**Problem:** Date fields validated only with `.min(1)` (non-empty string). Accepts `"not-a-date"`, `"13/32/2026"`, etc. Drizzle will silently coerce or error at DB level.  
**Fix:** Use Zod's built-in date validator:
```typescript
date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
```

---

### BUG-016 — Budget Category Hierarchy O(n²) Performance Problem
**File:** `src/app/api/budgets/stats/route.ts`, recursive `getDescendants` function  
**Problem:** For each category, `getDescendants` iterates all categories with `.filter()`. With 100 categories and 50 budgets, this is O(100 × 50) = 5,000 iterations per request.  
**Fix:** Pre-build a children map once:
```typescript
const childrenMap = new Map<string, string[]>();
allCategories.forEach(c => {
  if (c.parentId) {
    if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
    childrenMap.get(c.parentId)!.push(c.id);
  }
});
```

---

## 3. MEDIUM-SEVERITY BUGS (Severity: P2)

### BUG-017 — TypeScript Errors in Tests
**File:** `src/test/ai-api-integration.test.ts:149`, `src/test/ai-chatbot.test.ts:45`, `src/test/transactions-integration.test.ts:56`  
**Errors detected by `tsc --noEmit`:**
- `ai-api-integration.test.ts:149` — Parameter 'pill' implicitly has `any` type
- `ai-chatbot.test.ts:45` — Object literal has duplicate property names
- `transactions-integration.test.ts:56` — `db` (PostgresJsDatabase) passed where `PgTransaction` expected

These don't affect vitest (which ignores TS errors at runtime) but could hide real type bugs in CI.

---

### BUG-018 — E2E Test File Missing Type Annotation
**File:** `tests/e2e/system-debug.spec.ts:30`  
**Error:** Parameter 'page' implicitly has `any` type. Playwright requires `import { Page } from '@playwright/test'`.

---

### BUG-019 — Unused Variables Across Multiple Pages (Dead Code)
**Files:** `accounts/page.tsx`, `budgets/page.tsx`, `categories/page.tsx`, `scripts/delete-user.ts`, `scripts/reset-production.ts`  
**Scope:** 47+ unused imports/variables across the frontend pages (icons, hooks, formatters). These inflate bundle size and create maintenance noise.  
**Notable unused items:**
- `categories` variable assigned but never used in `accounts/page.tsx:69`
- `useBudgets` imported but unused in `budgets/page.tsx:10`
- `fmt` formatter assigned but unused in `categories/page.tsx:89`
- `incomeCount`, `expenseCount` assigned but never rendered in `categories/page.tsx:217–218`

---

### BUG-020 — `any` Type Annotations in All Frontend Pages (ESLint Errors)
**Files:** `accounts/page.tsx`, `budgets/page.tsx`, `categories/page.tsx` (and likely others)  
**Count:** 60+ explicit `any` type violations reported by ESLint  
**Problem:** These bypass TypeScript safety, meaning API response shape changes won't be caught at compile time.

---

### BUG-021 — No Rate Limiting on Financial Endpoints
**Problem:** POST endpoints for transfers, payments, and transactions lack rate limiting. A bad actor could brute-force goal deposit amounts or create thousands of transactions.  
**Fix:** Implement middleware using Vercel's edge rate limiting or an upstash/redis approach.

---

### BUG-022 — Dashboard Monthly Variation Returns 0 Instead of Null for No-Prior-Month Data
**File:** `src/app/api/dashboard/route.ts`, line ~165  
**Problem:** When previous month's net is 0 (first month of use), variation shows "0%" instead of "N/A". This misleads new users into thinking there was no growth when there was no prior data.  
**Fix:** Return `null` and handle it in the UI as "Sem dados anteriores".

---

### BUG-023 — Recurring Transaction Cron Creates Up to 12+ Transactions Per Run
**File:** `src/app/api/cron/process-recurring/route.ts`  
**Problem:** If cron misses several runs (e.g., Vercel cron disabled for a month), the next run creates ALL missed recurring transactions at once. For a user with 50 recurring transactions × 30 missed days = 1,500 inserts in a single cron run. No batch limit or catch-up cap is implemented.  
**Fix:** Add max catch-up cap (e.g., 3 missed periods max) and process in batches.

---

### BUG-024 — `ilike` Search Applied to `notes` Field Can Be Slow
**File:** `src/app/api/transactions/route.ts`, line 38–41  
**Problem:** `ilike` on unindexed `notes` (text column) causes full-table scans for large datasets.  
**Fix:** Add partial index on `transactions.description` and `transactions.notes`, or use PostgreSQL full-text search with `tsvector`.

---

## 4. LOW-SEVERITY (Severity: P3)

### BUG-025 — Credit Card `dueDay` and `closingDay` Allow Invalid Calendar Days
**File:** `src/lib/validations/index.ts`, line 116–117  
**Problem:** Day values up to 31 accepted, but some months have 28/29/30 days. E.g., `dueDay: 31` for a card that closes in February causes confusion.  
**Impact:** UI shows confusing next-due dates.

### BUG-026 — `startInstallment` Field Not Validated as `<= totalInstallments`
**File:** `src/lib/validations/index.ts`, line 107  
**Problem:** A user can submit `startInstallment: 5, totalInstallments: 3`, creating a loop that never executes (range `5..3` is empty).  
**Fix:** Add `.refine` to validate `startInstallment <= totalInstallments`.

### BUG-027 — Debug Routes Should Be Behind Feature Flag or Removed
**Files:** `src/app/api/debug/recalculate-all/route.ts`, `src/app/api/debug/transactions/route.ts`  
**Problem:** Both routes have TODO comments to remove them but they remain in production. They are auth-protected but expose internal operation details.

### BUG-028 — No CORS Configuration
**Problem:** API routes don't set `Access-Control-Allow-Origin` headers. While not exploitable in standard browser sessions, direct cross-origin API calls from other domains are possible.

### BUG-029 — Goal `endDate` Empty String Stored in Database
**File:** `src/lib/validations/index.ts`, line 80  
**Problem:** `endDate: z.string().optional().nullable()` doesn't prevent empty string `""` from being stored.  
**Fix:** Add `.transform(v => v === "" ? null : v)`.

---

## 5. TEST COVERAGE GAPS

| Area | Current Status | Missing Coverage |
|------|---------------|-----------------|
| Idempotency integration | Implemented, 0 usage tests | Duplicate transaction prevention |
| Transfer authorization | No test for cross-user accounts | Security boundary test |
| Installment edge cases | Partial | `startInstallment > 1` scenario |
| Goal over-deposit | No test | Amount capping |
| Cron catch-up | No test | Large backlog processing |
| Encryption key missing | No test | Startup crash validation |
| Budget threshold edge | No test | `alertThreshold < 50` rejection |

---

## 6. ARCHITECTURE OBSERVATIONS

### Positive Findings
- **Self-healing balances**: `recalculateAccountBalance()` rebuilds from transaction history on every write. Correct approach for eventual consistency.
- **Audit logging**: `logAudit()` called on all financial mutations. Good for forensics.
- **Database transactions**: All multi-step financial operations wrapped in `db.transaction()`. Atomicity is respected.
- **Soft deletes**: `deletedAt` pattern used consistently across transactions, accounts, cards.
- **84/84 unit tests passing**: Financial math tests (edge cases, rounding) all pass.
- **Drizzle ORM parameterization**: No raw SQL string interpolation found in queries. SQL injection risk is low.

### Structural Concerns
- **Balance stored as `varchar`/`text`**: The `balance` field in accounts and `currentAmount` in goals are stored as strings and constantly cast with `Number()`. Recommend migrating to `DECIMAL(15,2)` at DB level to eliminate manual casting and precision edge cases.
- **No request-level caching**: Dashboard and reports endpoints fetch the same user data on every request. TanStack Query handles client-side caching, but server-side queries run fresh every time.
- **`auth-utils.ts` email fallback sync**: The Clerk ID sync fallback (lines 36–54) makes an extra DB write on every request for new users. This should be rate-limited or moved to webhook-only.

---

## 7. PRIORITY REMEDIATION ROADMAP

### Sprint 1 — Critical Fixes (This Week)
| # | Bug | File | Effort |
|---|-----|------|--------|
| 1 | Fix idempotency cleanup logic inversion (`gt` → `lt`) | `idempotency.ts:108` | 5 min |
| 2 | Add destination account ownership check in transfers | `financial-engine.ts:167` | 30 min |
| 3 | Add `NODE_ENV !== 'production'` guard to debug bypass | `auth-utils.ts:14` | 5 min |
| 4 | Remove default encryption key fallback | `encryption.ts:3` | 10 min |
| 5 | Wire idempotency into POST /transactions | `api/transactions/route.ts` | 2h |
| 6 | Wire idempotency into POST /transfers | `api/transfers/route.ts` | 1h |
| 7 | Wire idempotency into goal deposits + invoice payments | 2 files | 2h |

### Sprint 2 — High Priority (Next Week)
| # | Bug | File | Effort |
|---|-----|------|--------|
| 8 | Fix card limit to exclude future months | `financial-engine.ts:225` | 1h |
| 9 | Add goal deposit cap at targetAmount | `financial-engine.ts:430` | 30 min |
| 10 | Make goal deposit atomic via SQL | `financial-engine.ts:430` | 20 min |
| 11 | Fix encryption error propagation | `encryption.ts:37` | 20 min |
| 12 | Add forecast date range filter | `api/forecast/route.ts:29` | 30 min |
| 13 | Fix installment remainder for partial purchases | `api/credit-cards/[id]/transactions/route.ts:98` | 1h |

### Sprint 3 — Medium Priority (This Month)
| # | Bug | File | Effort |
|---|-----|------|--------|
| 14 | Fix alertThreshold min (50 → 1) | `validations/index.ts:62` | 5 min |
| 15 | Fix goalContribution min (0 → positive) | `validations/index.ts:137` | 5 min |
| 16 | Add date format regex validation | `validations/index.ts:42` | 15 min |
| 17 | Fix budget hierarchy O(n²) | `api/budgets/stats/route.ts` | 1h |
| 18 | Fix soft-deleted account update | `api/accounts/[id]/route.ts` | 20 min |
| 19 | Fix TS errors in tests | 3 test files | 1h |
| 20 | Add `startInstallment <= totalInstallments` validation | `validations/index.ts:107` | 15 min |

### Sprint 4 — Low Priority / Technical Debt
| # | Item | Effort |
|---|------|--------|
| 21 | Remove/gate debug API routes | 30 min |
| 22 | Clean up 47+ unused imports | 2h |
| 23 | Replace `any` types across frontend pages | 4h |
| 24 | Migrate balance columns to `DECIMAL(15,2)` | 4h (migration) |
| 25 | Add rate limiting middleware | 2h |
| 26 | Add CORS configuration | 1h |
| 27 | Add recurring cron catch-up cap | 2h |

---

## 8. TESTING NOTES — igorpminacio@hotmail.com

Account under review corresponds to internal UUID `debfc4b5-45eb-45dc-90d3-30a83d4e1064` (referenced directly in `auth-utils.ts` debug bypass).

**Risks for this account specifically:**
1. The debug bypass hardcodes this user's UUID — if `AIOX_DEBUG_TOKEN` leaks, all their financial data is exposed via API without authentication.
2. All idempotency bugs affect this account: any UI double-submit creates duplicate transactions.
3. Goal over-deposit bug affects any active goals this account has.
4. Card limit inflation bug affects any credit cards this account has with future installments.

**Recommended test cases to validate after fixes:**
- [ ] Double-submit a transaction via "Save" button rapid click — should create only 1 transaction
- [ ] Add installment purchase (6x R$100) — verify each installment is exactly R$100.00, total = R$600.00
- [ ] Create goal R$1,000 → deposit R$1,100 — should be blocked with clear error message
- [ ] Transfer R$500 from checking to savings — source balance should decrease, destination increase, no double-debit
- [ ] Check card limit with future installments — limit used should reflect only current + past months
- [ ] Verify forecast page loads in < 3s with realistic data volume

---

## 9. METRICS SUMMARY

| Category | Count |
|----------|-------|
| Total source files audited | 670 |
| Tests passing | 84/84 ✅ |
| TypeScript compile errors (test files) | 4 |
| ESLint errors (no-explicit-any) | 60+ |
| ESLint warnings (unused vars) | 47+ |
| **Critical bugs (P0)** | **8** |
| **High severity bugs (P1)** | **8** |
| **Medium severity bugs (P2)** | **8** |
| Low severity bugs (P3) | **5** |
| **Total issues** | **29** |
| Architecture: Financial atomicity | ✅ Correct |
| Architecture: Audit logging | ✅ Correct |
| Architecture: Soft deletes | ✅ Correct |
| Architecture: Auth isolation | ⚠️ Partial (debug bypass) |
| Architecture: Idempotency | ❌ Broken (never used + cleanup inverted) |

---

*Generated by Morgan (PM Agent) — DUD.IA Finance Platform Audit*  
*— Morgan, planejando o futuro 📊*
