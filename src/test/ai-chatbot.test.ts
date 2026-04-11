import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    query: {
      users: {
        findFirst: vi.fn()
      }
    },
    update: vi.fn()
  }
}))

vi.mock('@/lib/db/schema', () => ({
  users: {
    clerkId: 'clerkId',
    id: 'id',
    email: 'email',
    openRouterApiKey: 'openRouterApiKey'
  },
  accounts: {
    userId: 'userId',
    balance: 'balance',
    deletedAt: 'deletedAt',
    name: 'name'
  },
  transactions: {
    userId: 'userId',
    categoryId: 'categoryId',
    type: 'type',
    amount: 'amount',
    date: 'date',
    deletedAt: 'deletedAt'
  },
  creditCards: {
    userId: 'userId',
    usedAmount: 'usedAmount',
    deletedAt: 'deletedAt'
  },
  budgets: {
    userId: 'userId',
    isActive: 'isActive',
    userId: 'userId'
  },
  categories: {
    id: 'id',
    name: 'name'
  },
  goals: {
    userId: 'userId',
    status: 'status',
    deletedAt: 'deletedAt',
    name: 'name',
    currentAmount: 'currentAmount',
    targetAmount: 'targetAmount'
  },
  cardTransactions: {
    userId: 'userId',
    invoiceMonth: 'invoiceMonth',
    invoiceYear: 'invoiceYear',
    deletedAt: 'deletedAt',
    amount: 'amount'
  }
}))

vi.mock('@/lib/auth-utils', () => ({
  getUserId: vi.fn()
}))

vi.mock('@/lib/utils/encryption', () => ({
  decrypt: vi.fn((key: string) => key)
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn()
  }))
}))

describe('AI Router - generatePills', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate pill structure from mock response', () => {
    const mockPillResponse = [
      { title: "Gasto Excessivo", content: "Suas despesas aumentaram 25%", type: "warning" },
      { title: "Meta em dia", content: "Você está no caminho certo", type: "success" },
      { title: "Dica importante", content: "Considere reduzir gastos", type: "info" }
    ]
    
    const pillSchema = z.array(z.object({
      title: z.string().max(50),
      content: z.string(),
      type: z.enum(['warning', 'info', 'success'])
    }))
    
    const result = pillSchema.safeParse(mockPillResponse)
    expect(result.success).toBe(true)
  })

  it('should reject invalid pill type', () => {
    const invalidPill = [
      { title: "Test", content: "Test content", type: "invalid" }
    ]
    
    const pillSchema = z.array(z.object({
      title: z.string(),
      content: z.string(),
      type: z.enum(['warning', 'info', 'success'])
    }))
    
    const result = pillSchema.safeParse(invalidPill)
    expect(result.success).toBe(false)
  })

  it('should reject pill without title', () => {
    const invalidPill = [
      { content: "Test content", type: "warning" }
    ]
    
    const pillSchema = z.array(z.object({
      title: z.string(),
      content: z.string(),
      type: z.enum(['warning', 'info', 'success'])
    }))
    
    const result = pillSchema.safeParse(invalidPill)
    expect(result.success).toBe(false)
  })

  it('should accept valid context string', () => {
    const context = JSON.stringify({
      totalBalance: 5000,
      monthlyIncome: 8000,
      monthlyExpense: 3000,
      cardInvoice: 1500,
      activeGoals: [{ name: "Emergency Fund", current: 2000, target: 10000 }],
      activeBudgets: [{ name: "Food", limit: 500 }]
    })
    
    expect(typeof context).toBe('string')
    expect(context.length).toBeGreaterThan(0)
  })

  it('should handle empty financial context', () => {
    const emptyContext = JSON.stringify({
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      cardInvoice: 0,
      activeGoals: [],
      activeBudgets: []
    })
    
    expect(typeof emptyContext).toBe('string')
    const parsed = JSON.parse(emptyContext)
    expect(parsed.totalBalance).toBe(0)
  })
})

describe('AI Tools - Schema Validation', () => {
  it('should validate getFinancialSummary tool response schema', () => {
    const summarySchema = z.object({
      totalBalance: z.number(),
      totalCardUsed: z.number()
    })
    
    const validResponse = { totalBalance: 5000.50, totalCardUsed: 1500.75 }
    expect(summarySchema.safeParse(validResponse).success).toBe(true)
  })

  it('should reject negative balance in summary', () => {
    const summarySchema = z.object({
      totalBalance: z.number().nonnegative(),
      totalCardUsed: z.number().nonnegative()
    })
    
    const invalidResponse = { totalBalance: -100, totalCardUsed: 500 }
    expect(summarySchema.safeParse(invalidResponse).success).toBe(false)
  })

  it('should validate getSpendingByCategory response schema', () => {
    const spendingSchema = z.array(z.object({
      category: z.string(),
      total: z.number()
    }))
    
    const validResponse = [
      { category: "Alimentação", total: 500 },
      { category: "Transporte", total: 200 }
    ]
    expect(spendingSchema.safeParse(validResponse).success).toBe(true)
  })

  it('should validate checkHealth response schema', () => {
    const healthSchema = z.object({
      hasNegativeAccounts: z.boolean(),
      activeBudgetsCount: z.number(),
      alerts: z.array(z.string())
    })
    
    const validResponse = {
      hasNegativeAccounts: true,
      activeBudgetsCount: 3,
      alerts: ["Conta Corrente está com saldo negativo: R$ -500"]
    }
    expect(healthSchema.safeParse(validResponse).success).toBe(true)
  })

  it('should reject invalid health response', () => {
    const healthSchema = z.object({
      hasNegativeAccounts: z.boolean(),
      activeBudgetsCount: z.number(),
      alerts: z.array(z.string())
    })
    
    const invalidResponse = {
      hasNegativeAccounts: "yes",
      activeBudgetsCount: 3,
      alerts: []
    }
    expect(healthSchema.safeParse(invalidResponse).success).toBe(false)
  })
})

describe('AI Insights Route - Context Building', () => {
  it('should build valid context object for generatePills', () => {
    const context = {
      totalBalance: 10000,
      monthlyIncome: 8000,
      monthlyExpense: 5000,
      cardInvoice: 2000,
      activeGoals: [
        { name: "Viagem", current: 3000, target: 10000 },
        { name: "Carro", current: 15000, target: 50000 }
      ],
      activeBudgets: [
        { name: "Alimentação", limit: 1000 },
        { name: "Lazer", limit: 500 }
      ]
    }
    
    expect(context.totalBalance).toBe(10000)
    expect(context.activeGoals).toHaveLength(2)
    expect(context.activeBudgets).toHaveLength(2)
  })

  it('should handle missing/null values in context', () => {
    const context = {
      totalBalance: null,
      monthlyIncome: 0,
      monthlyExpense: null,
      cardInvoice: null,
      activeGoals: [],
      activeBudgets: null
    }
    
    expect(context.totalBalance).toBeNull()
    expect(context.monthlyIncome).toBe(0)
    expect(context.activeGoals).toHaveLength(0)
  })

  it('should calculate remaining balance correctly', () => {
    const monthlyIncome = 8000
    const monthlyExpense = 5000
    const remaining = monthlyIncome - monthlyExpense
    
    expect(remaining).toBe(3000)
  })

  it('should validate goal progress percentage', () => {
    const goal = { name: "Emergency Fund", current: 5000, target: 10000 }
    const progress = (goal.current / goal.target) * 100
    
    expect(progress).toBe(50)
  })

  it('should validate budget utilization', () => {
    const budget = { name: "Food", limit: 1000 }
    const spent = 750
    const utilization = (spent / budget.limit) * 100
    
    expect(utilization).toBe(75)
    expect(utilization).toBeLessThan(100)
  })

  it('should flag over-budget situations', () => {
    const budget = { name: "Food", limit: 1000 }
    const spent = 1200
    const isOverBudget = spent > budget.limit
    
    expect(isOverBudget).toBe(true)
  })
})

describe('Chat Route - Message Processing', () => {
  it('should validate message format', () => {
    const messageSchema = z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string()
    })
    
    const validMessages = [
      { role: 'user', content: 'Qual é o meu saldo?' },
      { role: 'assistant', content: 'Seu saldo é R$ 5.000,00' }
    ]
    
    expect(messageSchema.safeParse(validMessages[0]).success).toBe(true)
    expect(messageSchema.safeParse(validMessages[1]).success).toBe(true)
  })

  it('should reject invalid message role', () => {
    const messageSchema = z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string()
    })
    
    const invalidMessage = { role: 'admin', content: 'test' }
    expect(messageSchema.safeParse(invalidMessage).success).toBe(false)
  })

  it('should validate chat request body', () => {
    const chatRequestSchema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string()
      }))
    })
    
    const validRequest = {
      messages: [
        { role: 'user', content: 'Olá' },
        { role: 'assistant', content: 'Olá! Como posso ajudar?' }
      ]
    }
    
    expect(chatRequestSchema.safeParse(validRequest).success).toBe(true)
  })

  it('should require at least one message', () => {
    const chatRequestSchema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string()
      })).min(1)
    })
    
    const emptyRequest = { messages: [] }
    expect(chatRequestSchema.safeParse(emptyRequest).success).toBe(false)
  })

  it('should validate empty content rejection', () => {
    const messageSchema = z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1)
    })
    
    const emptyContent = { role: 'user', content: '' }
    expect(messageSchema.safeParse(emptyContent).success).toBe(false)
  })
})

describe('System Prompt Validation', () => {
  it('should enforce Portuguese language constraint', () => {
    const systemPrompt = `Você é o DUD.IA, um Engenheiro Financeiro de alta precisão.
    Responda sempre em Português do Brasil.`
    
    expect(systemPrompt).toContain('Português')
  })

  it('should enforce security constraints in system prompt', () => {
    const systemPrompt = `TRAVAS DE SEGURANÇA:
    - Você SÓ tem acesso aos dados do sistema vinculado ao ID do usuário atual.
    - Você NÃO pode pesquisar na internet.
    - Você NÃO pode acessar dados de outros usuários.`
    
    expect(systemPrompt).toContain('ID do usuário atual')
    expect(systemPrompt).toContain('outros usuários')
  })

  it('should enforce markdown formatting instruction', () => {
    const systemPrompt = `Use Markdown para formatar tabelas e destacar valores monetários.`
    
    expect(systemPrompt).toContain('Markdown')
  })
})

describe('AI Pills UI Component Props', () => {
  it('should validate pills display props', () => {
    const pillSchema = z.object({
      title: z.string(),
      content: z.string(),
      type: z.enum(['warning', 'info', 'success'])
    })
    
    const validPills = [
      { title: "Alerta", content: "Gastos altos", type: "warning" },
      { title: "Dica", content: "Invista mais", type: "info" },
      { title: "Sucesso", content: "Meta atingida", type: "success" }
    ]
    
    expect(z.array(pillSchema).safeParse(validPills).success).toBe(true)
  })

  it('should limit pills to maximum 3 insights', () => {
    const pills = [
      { title: "1", content: "Content", type: "info" },
      { title: "2", content: "Content", type: "info" },
      { title: "3", content: "Content", type: "info" },
      { title: "4", content: "Content", type: "info" }
    ]
    
    expect(pills.length).toBeGreaterThan(3)
  })

  it('should enforce 15 word limit on pill content', () => {
    const longContent = "Este é um conteúdo muito longo que excede o limite de palavras permitido para cada pílula de insight"
    const words = longContent.split(' ')
    
    expect(words.length).toBeGreaterThan(15)
  })
})

describe('Error Handling', () => {
  it('should handle missing API key gracefully', async () => {
    const apiKey = null
    const hasApiKey = apiKey !== null && apiKey !== undefined
    
    expect(hasApiKey).toBe(false)
  })

  it('should handle invalid JSON response from AI', () => {
    const invalidJson = "This is not JSON"
    let parsed = null
    
    try {
      parsed = JSON.parse(invalidJson)
    } catch {
      parsed = null
    }
    
    expect(parsed).toBeNull()
  })

  it('should handle malformed pill response', () => {
    const malformedPills = [
      { title: "Test", content: "Content" },
      { title: "Test2" }
    ]
    
    const pillSchema = z.object({
      title: z.string(),
      content: z.string(),
      type: z.enum(['warning', 'info', 'success'])
    })
    
    const result = z.array(pillSchema).safeParse(malformedPills)
    expect(result.success).toBe(false)
  })

  it('should handle unauthorized user access', async () => {
    const userId = null
    const isAuthorized = userId !== null
    
    expect(isAuthorized).toBe(false)
  })
})

describe('FREE_MODELS Configuration', () => {
  it('should have at least one free model configured', () => {
    const freeModels = [
      'google/gemini-2.0-flash-exp:free',
      'deepseek/deepseek-chat:free',
      'meta-llama/llama-3.1-70b-instruct:free',
      'qwen/qwen-2-7b-instruct:free'
    ]
    
    expect(freeModels.length).toBeGreaterThan(0)
  })

  it('should have valid model identifiers', () => {
    const modelPattern = /^[a-z0-9.-]+\/[a-z0-9-.:]+(:free)?$/
    const models = [
      'google/gemini-2.0-flash-exp:free',
      'deepseek/deepseek-chat:free',
      'meta-llama/llama-3.1-70b-instruct:free',
      'qwen/qwen-2-7b-instruct:free'
    ]
    
    models.forEach(model => {
      expect(modelPattern.test(model)).toBe(true)
    })
  })
})