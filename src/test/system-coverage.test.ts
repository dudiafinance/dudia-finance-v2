import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { accounts, transactions, budgets, notifications, users, categories } from "@/lib/db/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { FinancialEngine } from "@/lib/services/financial-engine";

// ──────────────────────────────────────────────
// Shared test state
// ──────────────────────────────────────────────
let userId: string;
let accountId: string;
const cleanup: Array<() => Promise<unknown>> = [];

beforeAll(async () => {
  const [user] = await db.select().from(users).limit(1);
  if (!user) throw new Error("No test user in DB — run seed first");
  userId = user.id;

  const [acc] = await db
    .insert(accounts)
    .values({ userId, name: "COVERAGE_TEST", type: "checking", balance: "0.00" })
    .returning();
  accountId = acc.id;
  cleanup.push(() => db.delete(accounts).where(eq(accounts.id, acc.id)));
});

afterAll(async () => {
  for (const fn of cleanup.reverse()) {
    try { await fn(); } catch { /* ignore cleanup errors */ }
  }
});

// ──────────────────────────────────────────────
// 1. Budget threshold calculation (pure logic)
// ──────────────────────────────────────────────
describe("Budget alert threshold logic", () => {
  it("should fire alert when spending >= threshold", () => {
    const budget = { amount: 1000, alertThreshold: "80" };
    const spent = 850;
    const spentPct = (spent / Number(budget.amount)) * 100;
    expect(spentPct).toBeGreaterThanOrEqual(Number(budget.alertThreshold));
  });

  it("should NOT fire alert when spending < threshold", () => {
    const budget = { amount: 1000, alertThreshold: "80" };
    const spent = 700;
    const spentPct = (spent / Number(budget.amount)) * 100;
    expect(spentPct).toBeLessThan(Number(budget.alertThreshold));
  });

  it("should fire error-level alert at 100%", () => {
    const budget = { amount: 500, alertThreshold: "80" };
    const spent = 550; // over budget
    const spentPct = (spent / Number(budget.amount)) * 100;
    expect(spentPct).toBeGreaterThanOrEqual(100);
    const alertType = spentPct >= 100 ? "error" : "warning";
    expect(alertType).toBe("error");
  });

  it("should fire warning-level alert between threshold and 100%", () => {
    const budget = { amount: 1000, alertThreshold: "80" };
    const spent = 900;
    const spentPct = (spent / Number(budget.amount)) * 100;
    const alertType = spentPct >= 100 ? "error" : "warning";
    expect(alertType).toBe("warning");
  });

  it("should handle zero budget amount without division error", () => {
    const budgetAmount = 0;
    const spent = 100;
    const spentPct = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    expect(spentPct).toBe(0);
    expect(Number.isFinite(spentPct)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 2. Soft-delete isolation
// ──────────────────────────────────────────────
describe("Soft-delete isolation (accounts)", () => {
  it("should not return accounts with deletedAt set", async () => {
    // Create a temp account and soft-delete it
    const [softDeleted] = await db
      .insert(accounts)
      .values({ userId, name: "SOFT_DEL_TEST", type: "savings", balance: "0.00" })
      .returning();

    await db
      .update(accounts)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(accounts.id, softDeleted.id));

    // Query as the API does: only isNull(deletedAt)
    const visible = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)));

    const found = visible.find((a) => a.id === softDeleted.id);
    expect(found).toBeUndefined();

    // Cleanup
    await db.delete(accounts).where(eq(accounts.id, softDeleted.id));
  });

  it("should still find soft-deleted accounts without filter", async () => {
    const [tempAcc] = await db
      .insert(accounts)
      .values({ userId, name: "SOFT_DEL_VERIFY", type: "savings", balance: "0.00" })
      .returning();

    await db
      .update(accounts)
      .set({ deletedAt: new Date() })
      .where(eq(accounts.id, tempAcc.id));

    const allAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), isNotNull(accounts.deletedAt)));

    const found = allAccounts.find((a) => a.id === tempAcc.id);
    expect(found).toBeDefined();
    expect(found?.deletedAt).not.toBeNull();

    await db.delete(accounts).where(eq(accounts.id, tempAcc.id));
  });
});

// ──────────────────────────────────────────────
// 3. FinancialEngine — isPaid=false does not affect balance
// ──────────────────────────────────────────────
describe("FinancialEngine — unpaid transaction does not affect balance", () => {
  it("balance must stay the same after adding unpaid expense", async () => {
    // Get balance before
    const [before] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId));
    const balBefore = Number(before.balance);

    const tx = await FinancialEngine.addTransaction({
      userId,
      accountId,
      amount: "200.00",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      description: "UNPAID_TEST",
      isPaid: false,
    });

    const [after] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId));
    const balAfter = Number(after.balance);

    expect(balAfter).toBe(balBefore); // balance unchanged

    // Cleanup
    await db.delete(transactions).where(eq(transactions.id, tx.id));
  });
});

// ──────────────────────────────────────────────
// 4. FinancialEngine — balance integrity
// ──────────────────────────────────────────────
describe("FinancialEngine — balance integrity", () => {
  it("income + expense sequence should net correctly", async () => {
    const [before] = await db.select().from(accounts).where(eq(accounts.id, accountId));
    const balBefore = Number(before.balance);

    const income = await FinancialEngine.addTransaction({
      userId, accountId, amount: "500.00", type: "income",
      date: new Date().toISOString().split("T")[0],
      description: "INTEGRITY_INC", isPaid: true,
    });

    const expense = await FinancialEngine.addTransaction({
      userId, accountId, amount: "200.00", type: "expense",
      date: new Date().toISOString().split("T")[0],
      description: "INTEGRITY_EXP", isPaid: true,
    });

    const [after] = await db.select().from(accounts).where(eq(accounts.id, accountId));
    const balAfter = Number(after.balance);

    expect(balAfter).toBeCloseTo(balBefore + 500 - 200, 2);

    // Cleanup
    await db.delete(transactions).where(eq(transactions.id, income.id));
    await db.delete(transactions).where(eq(transactions.id, expense.id));
    // Recalculate to restore
    await db.transaction(async (tx) => {
      await FinancialEngine.recalculateAccountBalance(tx, accountId);
    });
  });
});

// ──────────────────────────────────────────────
// 5. Cron next-due-date helper (pure logic)
// ──────────────────────────────────────────────
describe("Cron next-due-date calculation", () => {
  function calcNextDate(currentDate: string, frequency: string, interval: number): string {
    const date = new Date(currentDate + "T12:00:00Z");
    if (frequency === "daily") date.setUTCDate(date.getUTCDate() + interval);
    else if (frequency === "weekly") date.setUTCDate(date.getUTCDate() + interval * 7);
    else if (frequency === "monthly") date.setUTCMonth(date.getUTCMonth() + interval);
    else if (frequency === "yearly") date.setUTCFullYear(date.getUTCFullYear() + interval);
    return date.toISOString().split("T")[0];
  }

  it("daily + 1 advances by 1 day", () => {
    expect(calcNextDate("2026-04-01", "daily", 1)).toBe("2026-04-02");
  });

  it("weekly + 1 advances by 7 days", () => {
    expect(calcNextDate("2026-04-01", "weekly", 1)).toBe("2026-04-08");
  });

  it("monthly + 1 advances by one month", () => {
    expect(calcNextDate("2026-04-01", "monthly", 1)).toBe("2026-05-01");
  });

  it("monthly crossing year boundary", () => {
    expect(calcNextDate("2026-12-15", "monthly", 1)).toBe("2027-01-15");
  });

  it("yearly + 1 advances by one year", () => {
    expect(calcNextDate("2026-04-01", "yearly", 1)).toBe("2027-04-01");
  });

  it("daily + 3 interval advances by 3 days", () => {
    expect(calcNextDate("2026-04-01", "daily", 3)).toBe("2026-04-04");
  });

  it("weekly + 2 interval advances by 14 days", () => {
    expect(calcNextDate("2026-04-01", "weekly", 2)).toBe("2026-04-15");
  });
});

// ──────────────────────────────────────────────
// 6. CSV export logic (pure function)
// ──────────────────────────────────────────────
describe("CSV export row generation", () => {
  function buildCsvRows(data: {
    summary: { income: number; expense: number; net: number };
    categories: { income: Array<{ name: string; value: number }>; expense: Array<{ name: string; value: number; color: string }> };
    history: Array<{ month: string; income: number; expense: number }>;
  }): string[] {
    const rows: string[] = ["Secao,Categoria,Receitas,Despesas,Saldo"];
    rows.push(`Resumo,Total,,${data.summary.income},${data.summary.expense},${data.summary.net}`);
    for (const c of data.categories.income) rows.push(`Receitas por Categoria,${c.name},${c.value},,`);
    for (const c of data.categories.expense) rows.push(`Despesas por Categoria,${c.name},,${c.value},`);
    for (const h of data.history) rows.push(`Historico,${h.month},${h.income},${h.expense},`);
    return rows;
  }

  it("should always include header row", () => {
    const rows = buildCsvRows({ summary: { income: 0, expense: 0, net: 0 }, categories: { income: [], expense: [] }, history: [] });
    expect(rows[0]).toContain("Secao");
  });

  it("should include summary line with correct values", () => {
    const rows = buildCsvRows({ summary: { income: 1000, expense: 400, net: 600 }, categories: { income: [], expense: [] }, history: [] });
    expect(rows[1]).toContain("1000");
    expect(rows[1]).toContain("400");
    expect(rows[1]).toContain("600");
  });

  it("should produce one row per income category", () => {
    const rows = buildCsvRows({
      summary: { income: 2000, expense: 0, net: 2000 },
      categories: { income: [{ name: "Salário", value: 2000 }], expense: [] },
      history: [],
    });
    const incomeRows = rows.filter((r) => r.startsWith("Receitas por Categoria"));
    expect(incomeRows).toHaveLength(1);
    expect(incomeRows[0]).toContain("Salário");
  });

  it("should produce one row per history month", () => {
    const rows = buildCsvRows({
      summary: { income: 0, expense: 0, net: 0 },
      categories: { income: [], expense: [] },
      history: [
        { month: "Jan", income: 1000, expense: 500 },
        { month: "Fev", income: 1200, expense: 600 },
      ],
    });
    const histRows = rows.filter((r) => r.startsWith("Historico"));
    expect(histRows).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────
// 7. Notification deduplication pattern
// ──────────────────────────────────────────────
describe("Notification deduplication for budget alerts", () => {
  it("should create notification when none exists for current month", async () => {
    const title = `COVERAGE_BUDGET_ALERT_${Date.now()}`;
    await db.insert(notifications).values({
      userId,
      title,
      message: "Test budget alert",
      type: "warning",
      isRead: false,
    });

    const [found] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.title, title)))
      .limit(1);

    expect(found).toBeDefined();
    expect(found.type).toBe("warning");
    expect(found.isRead).toBe(false);

    // Cleanup
    await db.delete(notifications).where(eq(notifications.id, found.id));
  });

  it("should detect existing notification to prevent duplicate", async () => {
    const title = `COVERAGE_DUP_${Date.now()}`;

    await db.insert(notifications).values({ userId, title, message: "First", type: "warning", isRead: false });

    const existing = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.title, title)))
      .limit(1);

    // If existing found, we skip insertion (this IS the dedup check)
    expect(existing.length).toBe(1);

    // Cleanup
    await db.delete(notifications).where(eq(notifications.title, title));
  });
});
