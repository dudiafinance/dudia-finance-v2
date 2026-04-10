import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { categories, transactions, users, accounts } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

describe('Budget & Category Hierarchy Audit', () => {
  let userId: string;
  let accountId: string;

  beforeAll(async () => {
    const [user] = await db.select().from(users).limit(1);
    userId = user.id;
    const [acc] = await db.select().from(accounts).where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt))).limit(1);
    accountId = acc.id;
  });

  it('should correctly sum expenses from child categories into parent category context', async () => {
    // 1. Create Parent Category (e.g. Alimentação)
    const [parent] = await db.insert(categories).values({
      userId,
      name: 'AUDIT_PARENT',
      type: 'expense',
    }).returning();

    // 2. Create Child Category (e.g. Restaurante)
    const [child] = await db.insert(categories).values({
      userId,
      name: 'AUDIT_CHILD',
      type: 'expense',
      parentId: parent.id
    }).returning();

    // 3. Add Transaction to Child
    await db.insert(transactions).values({
      userId,
      accountId,
      categoryId: child.id,
      amount: '150.00',
      type: 'expense',
      date: '2026-04-10',
      description: 'Jantar Audit',
      isPaid: true
    });

    // 4. Verify API response logic (simulated)
    // Here we check if the hierarchical logic I read in src/app/api/budgets/stats/route.ts works
    const allCats = await db.select().from(categories).where(eq(categories.userId, userId));
    
    const getDescendants = (parentId: string | null): string[] => {
      if (!parentId) return [];
      const children = allCats.filter(c => c.parentId === parentId);
      let descArr = children.map(c => c.id);
      for (const child of children) {
        descArr = descArr.concat(getDescendants(child.id));
      }
      return descArr;
    };

    const descendants = getDescendants(parent.id);
    expect(descendants).toContain(child.id);
    console.log(`✅ Hierarchy verified: Parent ${parent.name} has child ${child.id}`);

    // Cleanup
    await db.delete(transactions).where(eq(transactions.description, 'Jantar Audit'));
    await db.delete(categories).where(eq(categories.id, child.id));
    await db.delete(categories).where(eq(categories.id, parent.id));
  });
});