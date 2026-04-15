import { describe, it, expect } from 'vitest'
import { 
  registerSchema, 
  accountSchema, 
  transactionSchema, 
  budgetSchema,
  goalSchema,
  cardTransactionSchema,
  creditCardSchema,
  transferSchema,
  goalDepositSchema,
  payInvoiceSchema
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      })
      expect(result.success).toBe(true)
    })

    it('should reject weak password', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password'
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123'
      })
      expect(result.success).toBe(false)
    })

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        name: 'J',
        email: 'john@example.com',
        password: 'Password123'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('accountSchema', () => {
    it('should validate checking account', () => {
      const result = accountSchema.safeParse({
        name: 'Main Account',
        type: 'checking',
        balance: 1000
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid account type', () => {
      const result = accountSchema.safeParse({
        name: 'Main Account',
        type: 'invalid',
        balance: 1000
      })
      expect(result.success).toBe(false)
    })
  })

  describe('transactionSchema', () => {
    it('should validate income transaction', () => {
      const result = transactionSchema.safeParse({
        accountId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 100.50,
        type: 'income',
        date: '2024-01-15',
        description: 'Salary'
      })
      expect(result.success).toBe(true)
    })

    it('should validate expense transaction', () => {
      const result = transactionSchema.safeParse({
        accountId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 50,
        type: 'expense',
        date: '2024-01-15',
        description: 'Groceries'
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative amount', () => {
      const result = transactionSchema.safeParse({
        accountId: '123e4567-e89b-12d3-a456-426614174000',
        amount: -100,
        type: 'income',
        date: '2024-01-15',
        description: 'Test'
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty description', () => {
      const result = transactionSchema.safeParse({
        accountId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 100,
        type: 'income',
        date: '2024-01-15',
        description: ''
      })
      expect(result.success).toBe(false)
    })
  })

  describe('budgetSchema', () => {
    it('should validate monthly budget', () => {
      const result = budgetSchema.safeParse({
        name: 'Food Budget',
        amount: 500,
        period: 'monthly',
        startDate: '2024-01-01'
      })
      expect(result.success).toBe(true)
    })

    it('should reject end date before start date', () => {
      const result = budgetSchema.safeParse({
        name: 'Food Budget',
        amount: 500,
        period: 'monthly',
        startDate: '2024-12-01',
        endDate: '2024-01-01'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('goalSchema', () => {
    it('should validate target goal', () => {
      const result = goalSchema.safeParse({
        name: 'Emergency Fund',
        targetAmount: 10000,
        startDate: '2024-01-01',
        goalType: 'target'
      })
      expect(result.success).toBe(true)
    })

    it('should validate monthly contribution goal', () => {
      const result = goalSchema.safeParse({
        name: 'Savings',
        monthlyContribution: 500,
        startDate: '2024-01-01',
        goalType: 'monthly'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('cardTransactionSchema', () => {
    it('should validate single transaction', () => {
      const result = cardTransactionSchema.safeParse({
        description: 'Netflix',
        amount: 55.90,
        date: '2024-01-15',
        launchType: 'single',
        invoiceMonth: 1,
        invoiceYear: 2024
      })
      expect(result.success).toBe(true)
    })

    it('should validate installment transaction', () => {
      const result = cardTransactionSchema.safeParse({
        description: 'iPhone',
        amount: 1000,
        date: '2024-01-15',
        launchType: 'installment',
        invoiceMonth: 1,
        invoiceYear: 2024,
        totalInstallments: 12,
        startInstallment: 1
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid invoice month', () => {
      const result = cardTransactionSchema.safeParse({
        description: 'Test',
        amount: 100,
        date: '2024-01-15',
        launchType: 'single',
        invoiceMonth: 13,
        invoiceYear: 2024
      })
      expect(result.success).toBe(false)
    })
  })

  describe('creditCardSchema', () => {
    it('should validate credit card', () => {
      const result = creditCardSchema.safeParse({
        name: 'Nubank',
        bank: 'NuBank',
        limit: 10000,
        dueDay: 15,
        closingDay: 8
      })
      expect(result.success).toBe(true)
    })

    it('should reject same due and closing day', () => {
      const result = creditCardSchema.safeParse({
        name: 'Nubank',
        bank: 'NuBank',
        limit: 10000,
        dueDay: 15,
        closingDay: 15
      })
      expect(result.success).toBe(false)
    })
  })

  describe('transferSchema', () => {
    it('should validate transfer between different accounts', () => {
      const result = transferSchema.safeParse({
        fromAccountId: '123e4567-e89b-12d3-a456-426614174000',
        toAccountId: '223e4567-e89b-12d3-a456-426614174001',
        amount: 100,
        description: 'Transfer',
        date: '2024-01-15'
      })
      expect(result.success).toBe(true)
    })

    it('should reject transfer to same account', () => {
      const sameId = '123e4567-e89b-12d3-a456-426614174000'
      const result = transferSchema.safeParse({
        fromAccountId: sameId,
        toAccountId: sameId,
        amount: 100,
        description: 'Transfer',
        date: '2024-01-15'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('goalDepositSchema', () => {
    it('should validate goal deposit', () => {
      const result = goalDepositSchema.safeParse({
        goalId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '223e4567-e89b-12d3-a456-426614174001',
        amount: 500,
        date: '2024-01-15'
      })
      expect(result.success).toBe(true)
    })

    it('should reject zero amount', () => {
      const result = goalDepositSchema.safeParse({
        goalId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '223e4567-e89b-12d3-a456-426614174001',
        amount: 0,
        date: '2024-01-15'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('payInvoiceSchema', () => {
    it('should validate invoice payment without userId in payload', () => {
      const result = payInvoiceSchema.safeParse({
        cardId: '223e4567-e89b-12d3-a456-426614174001',
        accountId: '323e4567-e89b-12d3-a456-426614174002',
        amount: 1500,
        date: '2024-01-15'
      })
      expect(result.success).toBe(true)
    })
  })
})
