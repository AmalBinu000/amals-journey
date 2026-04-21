'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Transaction = {
  id: number
  type: string
  amount: number
  category: string
  description: string
  date: string
}

const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Rent', 'Learning', 
  'Entertainment', 'Health', 'Shopping', 'Other'
]

export default function FinanceView() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mode, setMode] = useState<'dashboard' | 'add'>('dashboard')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTransactions() }, [])

  async function fetchTransactions() {
    const { data } = await supabase
      .from('finances')
      .select('*')
      .order('date', { ascending: false })
    if (data) setTransactions(data)
  }

  async function saveTransaction() {
    if (!amount || isNaN(Number(amount))) return
    setSaving(true)
    await supabase.from('finances').insert([{
      type,
      amount: Number(amount),
      category: type === 'income' ? 'Salary' : category,
      description,
      date: date
    }])
    setAmount('')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    await fetchTransactions()
    setSaving(false)
    setMode('dashboard')
  }

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 
    ? Math.round((balance / totalIncome) * 100) 
    : 0

  const expensesByCategory = EXPENSE_CATEGORIES.map(cat => ({
    category: cat,
    amount: monthlyTransactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0)
  })).filter(c => c.amount > 0)

  if (mode === 'add') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setMode('dashboard')}
            className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors"
          >
            ← Back
          </button>
          <span className="text-xs text-zinc-600 uppercase tracking-widest">
            Add Transaction
          </span>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setType('expense'); setCategory('Food') }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              type === 'expense'
                ? 'bg-red-500 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              type === 'income'
                ? 'bg-green-500 text-white'
                : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Income
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">
              Amount (₹)
            </p>
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-2xl font-medium outline-none focus:border-blue-500 transition-colors placeholder-zinc-700 text-white"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              autoFocus
            />
          </div>

          {type === 'expense' && (
            <div>
              <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      category === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">
              Date
            </p>
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors text-white"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div>
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">
              Description (optional)
            </p>
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors placeholder-zinc-700 text-white"
              placeholder={type === 'income' ? 'Salary, freelance payment...' : 'Swiggy order, auto fare...'}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button
            onClick={saveTransaction}
            disabled={saving}
            className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 py-3 rounded-xl text-sm font-medium transition-colors mt-2"
          >
            {saving ? 'Saving...' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
          <h2 className="text-2xl font-semibold text-white">Finance Tracker</h2>
        </div>
        <button
          onClick={() => setMode('add')}
          className="border border-zinc-700 hover:border-zinc-400 text-zinc-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
        >
          + Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Income</p>
          <p className="text-2xl font-semibold text-green-400">
            ₹{totalIncome.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Expenses</p>
          <p className="text-2xl font-semibold text-red-400">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Balance</p>
          <p className={`text-2xl font-semibold ${
            balance >= 0 ? 'text-blue-400' : 'text-red-400'
          }`}>
            ₹{balance.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">
            Savings rate
          </p>
          <p className="text-4xl font-semibold text-white mb-2">
            {savingsRate}%
          </p>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(savingsRate, 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-700 mt-2">Target: 30% savings rate</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">
            Goal progress
          </p>
          <p className="text-xs text-zinc-500 mb-1">Current income</p>
          <p className="text-xl font-semibold text-white mb-3">
            ₹{totalIncome.toLocaleString('en-IN')}
            <span className="text-zinc-600 text-sm font-normal"> / ₹2,00,000 target</span>
          </p>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((totalIncome / 200000) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-700 mt-2">24 LPA = ₹2L/month</p>
        </div>
      </div>

      {expensesByCategory.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">
            Spending by category
          </p>
          <div className="flex flex-col gap-3">
            {expensesByCategory
              .sort((a, b) => b.amount - a.amount)
              .map(cat => (
                <div key={cat.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">{cat.category}</span>
                    <span className="text-zinc-400">
                      ₹{cat.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full"
                      style={{ 
                        width: `${(cat.amount / totalExpenses) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">
          Recent transactions
        </p>
        {monthlyTransactions.length === 0 ? (
          <p className="text-zinc-700 text-sm text-center py-6">
            No transactions yet. Add your first one above.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {monthlyTransactions.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    t.type === 'income' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="text-xs text-zinc-300">{t.description || t.category}</p>
                    <p className="text-xs text-zinc-600">{t.category} · {t.date}</p>
                  </div>
                </div>
                <p className={`text-sm font-medium ${
                  t.type === 'income' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}