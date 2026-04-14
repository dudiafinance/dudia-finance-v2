# Database Health Report

**Generated:** 2026-04-14  
**Database:** PostgreSQL (Neon)

---

## Index Summary

### Total Indexes by Table

| Table | Index Count | Indexes |
|-------|-------------|---------|
| transactions | 10 | user_id, date, user_id+date, account_id+isPaid, account_id+date, account_id, category_id, user_id+category_id+date, linked_tx, recurring_group |
| card_transactions | 7 | invoice_month+invoice_year, user_id+card_id+invoice, user_id+invoice, user_id, date, user_id+date, user_id+category_id+date |
| accounts | 1 | user_id |
| categories | 1 | user_id+parent_id |
| tags | 1 | user_id+name |
| budgets | 2 | user_id, user_id+is_active |
| goals | 1 | user_id |
| goal_contributions | 3 | user_id, goal_id, goal_id+month+year |
| recurring_transactions | 2 | user_id, next_due_date |
| credit_cards | 1 | user_id |
| credit_card_invoices | 1 | card_id+month+year |
| notifications | 2 | user_id, is_read |
| audit_logs | 3 | user_id, entity_type+entity_id, created_at |
| idempotency_keys | 1 | user_id+key |

---

## Missing Indexes Added

The following indexes were created to optimize query performance:

### Soft-Delete Optimization (Partial Indexes)

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `transactions_user_deleted_idx` | transactions | user_id, deleted_at | Optimizes soft-delete queries |
| `accounts_user_deleted_idx` | accounts | user_id, deleted_at | Optimizes soft-delete queries |
| `goals_user_deleted_idx` | goals | user_id, deleted_at | Optimizes soft-delete queries |
| `credit_cards_user_deleted_idx` | credit_cards | user_id, deleted_at | Optimizes soft-delete queries |
| `card_transactions_user_deleted_idx` | card_transactions | user_id, deleted_at | Optimizes soft-delete queries |

### Recurring Transactions Optimization

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `recurring_transactions_user_active_idx` | recurring_transactions | user_id, is_active | Filters active recurring transactions |
| `recurring_transactions_user_active_next_idx` | recurring_transactions | user_id, is_active, next_due_date | Optimizes forecast route |

### Account Balance Optimization

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `accounts_user_include_active_idx` | accounts | user_id, include_in_total, is_active | Optimizes account balance aggregation |

### Card Transactions Optimization

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `card_transactions_user_invoice_idx` | card_transactions | user_id, invoice_month, invoice_year | Optimizes card transactions by invoice period |

---

## Query Optimization Recommendations

### High Priority

1. **Composite Index for Dashboard Queries**
   - Consider adding `transactions(user_id, date, type)` for dashboard summary queries

2. **Budget Alerts Query Optimization**
   - The `budgets_user_active_idx` already helps, but verify budget-vs-actual comparison queries use it

3. **Recurring Transactions Cron Job**
   - The `recurring_transactions_user_active_next_idx` should optimize the cron job that processes due recurring transactions

### Medium Priority

4. **Forecast Route**
   - Ensure `/api/forecast` uses `recurring_transactions_user_active_next_idx` for upcoming transactions query

5. **Account Sync Endpoint**
   - Verify `accounts_user_include_active_idx` is used when calculating total balances

6. **Card Invoice Reports**
   - `card_transactions_user_invoice_idx` should optimize invoice period queries

---

## Script Execution Status

| Script | Status | Notes |
|--------|--------|-------|
| `add-missing-indexes.ts` | ✅ Success | 9 indexes created (1 already existed) |
| `remove-password-hash.ts` | ✅ Success | No action needed - column doesn't exist |

---

## Maintenance Notes

- Partial indexes with `WHERE deleted_at IS NOT NULL` are used for soft-delete optimization
- These indexes only index non-deleted records, keeping index size small
- Index creation uses `CREATE INDEX IF NOT EXISTS` for idempotent execution
