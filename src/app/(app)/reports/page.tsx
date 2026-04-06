"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Download, Calendar } from "lucide-react";
import { mockMonthlyData, mockExpenseByCategory, mockIncomeByCategory } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");

  const totalIncome = mockIncomeByCategory.reduce((sum, c) => sum + c.value, 0);
  const totalExpense = mockExpenseByCategory.reduce((sum, c) => sum + c.value, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {["week", "month", "year"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              period === p ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Receitas</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Despesas</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Saldo Líquido</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(netBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Receitas por Categoria</h2>
          <div className="mt-4 space-y-3">
            {mockIncomeByCategory.map((item, index) => {
              const percent = (item.value / totalIncome) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Despesas por Categoria</h2>
          <div className="mt-4 space-y-3">
            {mockExpenseByCategory.map((item, index) => {
              const percent = (item.value / totalExpense) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full" style={{ width: `${percent}%`, backgroundColor: item.color || '#64748B' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Evolução Mensal</h2>
        <div className="mt-6">
          <div className="flex items-end justify-around gap-4 h-64">
            {mockMonthlyData.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="flex w-full items-end justify-center gap-1 h-48">
                  <div 
                    className="w-8 rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors"
                    style={{ height: `${(item.income / 15000) * 100}%` }}
                    title={`Receitas: ${formatCurrency(item.income)}`}
                  />
                  <div 
                    className="w-8 rounded-t bg-red-400 hover:bg-red-500 transition-colors"
                    style={{ height: `${(item.expense / 15000) * 100}%` }}
                    title={`Despesas: ${formatCurrency(item.expense)}`}
                  />
                </div>
                <span className="mt-2 text-xs text-slate-500">{item.month}</span>
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
    </div>
  );
}
