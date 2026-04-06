"use client";

import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  PiggyBank,
  Target
} from "lucide-react";
import { mockDashboardSummary, mockAccounts, mockTransactions, mockIncomeByCategory, mockExpenseByCategory, mockMonthlyData } from "@/lib/mock-data";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function DashboardPage() {
  const summary = mockDashboardSummary;
  const accounts = mockAccounts.filter(a => a.includeInTotal);
  const recentTransactions = mockTransactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Abril 2026</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Saldo Total</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(summary.totalBalance)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600">+{summary.monthlyVariation}%</span>
            <span className="text-sm text-slate-500">vs mês anterior</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Receitas</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1">
            <span className="text-sm text-slate-500">Este mês</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Despesas</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1">
            <span className="text-sm text-slate-500">Este mês</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Economia</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(summary.totalIncome - summary.totalExpense)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1">
            <span className="text-sm text-slate-500">Resultado mensal</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Receitas vs Despesas</h2>
          <div className="mt-4 h-64">
            <div className="flex h-full items-end justify-around gap-2">
              {mockMonthlyData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex w-12 flex-col items-center gap-1 rounded-t-lg bg-slate-100 p-2">
                    <div 
                      className="w-full rounded-t bg-emerald-500" 
                      style={{ height: `${(item.income / 12000) * 100}%`, minHeight: '4px' }}
                    />
                    <div 
                      className="w-full rounded-t bg-red-400" 
                      style={{ height: `${(item.expense / 12000) * 100}%`, minHeight: '4px' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{item.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-emerald-500"></div>
                <span className="text-xs text-slate-600">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-400"></div>
                <span className="text-xs text-slate-600">Despesas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Despesas por Categoria</h2>
          <div className="mt-4 space-y-3">
            {mockExpenseByCategory.map((item, index) => {
              const percentage = (item.value / mockExpenseByCategory.reduce((a, b) => a + b.value, 0)) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: `${percentage}%`, backgroundColor: item.color || '#64748B' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Contas</h2>
          <div className="mt-4 space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${account.color}20` }}
                  >
                    <Wallet className="h-5 w-5" style={{ color: account.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{account.name}</p>
                    <p className="text-xs text-slate-500">{account.bank || 'Carteira'}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Transações Recentes</h2>
            <a href="/transactions" className="text-sm text-emerald-600 hover:underline">Ver todas</a>
          </div>
          <div className="mt-4 space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    transaction.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{transaction.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${
                  transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
