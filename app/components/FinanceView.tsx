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

type Saving = {
    id: number
    name: string
    type: string
    amount: number
    date: string
    notes: string
}

type Lent = {
    id: number
    person_name: string
    amount: number
    reason: string
    date: string
    returned: boolean
}

const EXPENSE_CATEGORIES = [
    'Food', 'Transport', 'Rent', 'Learning',
    'Entertainment', 'Health', 'Shopping', 'Other'
]

const SAVING_TYPES = [
    { value: 'mutual_fund', label: 'Mutual Fund' },
    { value: 'gold', label: 'Gold' },
    { value: 'fixed_deposit', label: 'Fixed Deposit' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'stocks', label: 'Stocks' },
    { value: 'other', label: 'Other' },
]

export default function FinanceView() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [savings, setSavings] = useState<Saving[]>([])
    const [lents, setLents] = useState<Lent[]>([])
    const [view, setView] = useState<'overview' | 'expenses' | 'savings' | 'lent'>('overview')
    const [addMode, setAddMode] = useState<'expense' | 'saving' | 'lent' | null>(null)

    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('Food')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [expenseType, setExpenseType] = useState<'income' | 'expense'>('expense')
    const [savingName, setSavingName] = useState('')
    const [savingType, setSavingType] = useState('mutual_fund')
    const [savingNotes, setSavingNotes] = useState('')
    const [lentPerson, setLentPerson] = useState('')
    const [lentReason, setLentReason] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchAll()
    }, [])

    async function fetchAll() {
        const [t, s, l] = await Promise.all([
            supabase.from('finances').select('*').order('date', { ascending: false }),
            supabase.from('savings').select('*').order('date', { ascending: false }),
            supabase.from('lent').select('*').order('date', { ascending: false })
        ])
        if (t.data) setTransactions(t.data)
        if (s.data) setSavings(s.data)
        if (l.data) setLents(l.data)
    }

    async function saveExpense() {
        if (!amount || isNaN(Number(amount))) return
        setSaving(true)
        await supabase.from('finances').insert([{
            type: expenseType,
            amount: Number(amount),
            category: expenseType === 'income' ? 'Salary' : category,
            description,
            date
        }])
        setAmount(''); setDescription('')
        setDate(new Date().toISOString().split('T')[0])
        await fetchAll()
        setSaving(false)
        setAddMode(null)
    }

    async function saveSaving() {
        if (!savingName.trim() || !amount || isNaN(Number(amount))) return
        setSaving(true)
        await supabase.from('savings').insert([{
            name: savingName, type: savingType,
            amount: Number(amount), date, notes: savingNotes
        }])
        setAmount(''); setSavingName(''); setSavingNotes('')
        setDate(new Date().toISOString().split('T')[0])
        await fetchAll()
        setSaving(false)
        setAddMode(null)
    }

    async function saveLent() {
        if (!lentPerson.trim() || !amount || isNaN(Number(amount))) return
        setSaving(true)
        await supabase.from('lent').insert([{
            person_name: lentPerson, amount: Number(amount),
            reason: lentReason, date
        }])
        setAmount(''); setLentPerson(''); setLentReason('')
        setDate(new Date().toISOString().split('T')[0])
        await fetchAll()
        setSaving(false)
        setAddMode(null)
    }

    async function toggleReturned(id: number, returned: boolean) {
        await supabase.from('lent').update({ returned: !returned }).eq('id', id)
        await fetchAll()
    }

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthly = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const totalIncome = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalSavings = savings.reduce((s, t) => s + t.amount, 0)
    const totalLent = lents.filter(l => !l.returned).reduce((s, l) => s + l.amount, 0)

    const expensesByCategory = EXPENSE_CATEGORIES.map(cat => ({
        category: cat,
        amount: monthly.filter(t => t.type === 'expense' && t.category === cat)
            .reduce((s, t) => s + t.amount, 0)
    })).filter(c => c.amount > 0)

    if (addMode) {
        return (
            <div className="max-w-lg mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setAddMode(null)}
                        className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors">
                        ← Back
                    </button>
                    <span className="text-xs text-zinc-600 uppercase tracking-widest">
                        Add {addMode === 'expense' ? 'Transaction' : addMode === 'saving' ? 'Investment' : 'Lent Money'}
                    </span>
                </div>

                {addMode === 'expense' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <button onClick={() => { setExpenseType('expense'); setCategory('Food') }}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${expenseType === 'expense' ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}>
                                Expense
                            </button>
                            <button onClick={() => setExpenseType('income')}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${expenseType === 'income' ? 'bg-green-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}>
                                Income
                            </button>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Amount (₹)</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-2xl font-medium outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} type="number" autoFocus />
                        </div>
                        {expenseType === 'expense' && (
                            <div>
                                <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Category</p>
                                <div className="flex flex-wrap gap-2">
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <button key={cat} onClick={() => setCategory(cat)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Date</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white"
                                type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Description (optional)</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="Swiggy order, auto fare..." value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <button onClick={saveExpense} disabled={saving}
                            className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 py-3 rounded-xl text-sm font-medium transition-colors mt-2">
                            {saving ? 'Saving...' : `Add ${expenseType === 'income' ? 'Income' : 'Expense'}`}
                        </button>
                    </div>
                )}

                {addMode === 'saving' && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Investment name</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="SBI Bluechip Fund, Digital Gold..." value={savingName} onChange={e => setSavingName(e.target.value)} autoFocus />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Type</p>
                            <div className="flex flex-wrap gap-2">
                                {SAVING_TYPES.map(t => (
                                    <button key={t.value} onClick={() => setSavingType(t.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${savingType === t.value ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Amount (₹)</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-2xl font-medium outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} type="number" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Date</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white"
                                type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Notes (optional)</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="SIP of ₹2000/month..." value={savingNotes} onChange={e => setSavingNotes(e.target.value)} />
                        </div>
                        <button onClick={saveSaving} disabled={saving}
                            className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 py-3 rounded-xl text-sm font-medium transition-colors mt-2">
                            {saving ? 'Saving...' : 'Add Investment'}
                        </button>
                    </div>
                )}

                {addMode === 'lent' && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Person name</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="Who did you lend to?" value={lentPerson} onChange={e => setLentPerson(e.target.value)} autoFocus />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Amount (₹)</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-2xl font-medium outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} type="number" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Date</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white"
                                type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Reason (optional)</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="For what purpose?" value={lentReason} onChange={e => setLentReason(e.target.value)} />
                        </div>
                        <button onClick={saveLent} disabled={saving}
                            className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 py-3 rounded-xl text-sm font-medium transition-colors mt-2">
                            {saving ? 'Saving...' : 'Add Lent Entry'}
                        </button>
                    </div>
                )}
            </div>
        )
    }

    if (view === 'expenses') {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('overview')}
                            className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors">← Back</button>
                        <h2 className="text-2xl font-semibold text-white">Expenses</h2>
                    </div>
                    <button onClick={() => setAddMode('expense')}
                        className="border border-zinc-700 hover:border-zinc-400 text-zinc-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                        + Add
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Income</p>
                        <p className="text-2xl font-semibold text-green-400">₹{totalIncome.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Expenses</p>
                        <p className="text-2xl font-semibold text-red-400">₹{totalExpenses.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Balance</p>
                        <p className={`text-2xl font-semibold ${totalIncome - totalExpenses >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            ₹{(totalIncome - totalExpenses).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
                {expensesByCategory.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
                        <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">By category</p>
                        {expensesByCategory.sort((a, b) => b.amount - a.amount).map(cat => (
                            <div key={cat.category} className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-400">{cat.category}</span>
                                    <span className="text-zinc-400">₹{cat.amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-1">
                                    <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${(cat.amount / totalExpenses) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">All transactions</p>
                    {monthly.length === 0 ? (
                        <p className="text-zinc-700 text-sm text-center py-6">No transactions this month.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {monthly.map(t => (
                                <div key={t.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
                                        <div>
                                            <p className="text-xs text-zinc-300">{t.description || t.category}</p>
                                            <p className="text-xs text-zinc-600">{t.category} · {t.date}</p>
                                        </div>
                                    </div>
                                    <p className={`text-sm font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
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

    if (view === 'savings') {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('overview')}
                            className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors">← Back</button>
                        <h2 className="text-2xl font-semibold text-white">Savings & Investments</h2>
                    </div>
                    <button onClick={() => setAddMode('saving')}
                        className="border border-zinc-700 hover:border-zinc-400 text-zinc-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                        + Add
                    </button>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Total portfolio</p>
                    <p className="text-4xl font-semibold text-white">₹{totalSavings.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">All investments</p>
                    {savings.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-zinc-700 text-sm mb-4">No investments yet.</p>
                            <button onClick={() => setAddMode('saving')} className="text-blue-500 text-sm">Add your first investment →</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {savings.map(s => (
                                <div key={s.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                                    <div>
                                        <p className="text-xs text-zinc-300 font-medium">{s.name}</p>
                                        <p className="text-xs text-zinc-600">{SAVING_TYPES.find(t => t.value === s.type)?.label} · {s.date}</p>
                                        {s.notes && <p className="text-xs text-zinc-700 mt-0.5">{s.notes}</p>}
                                    </div>
                                    <p className="text-sm font-medium text-green-400">₹{s.amount.toLocaleString('en-IN')}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (view === 'lent') {
        return (
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('overview')}
                            className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors">← Back</button>
                        <h2 className="text-2xl font-semibold text-white">Lent Money</h2>
                    </div>
                    <button onClick={() => setAddMode('lent')}
                        className="border border-zinc-700 hover:border-zinc-400 text-zinc-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                        + Add
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Outstanding</p>
                        <p className="text-2xl font-semibold text-amber-400">₹{totalLent.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Total lent</p>
                        <p className="text-2xl font-semibold text-white">
                            ₹{lents.reduce((s, l) => s + l.amount, 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">All entries</p>
                    {lents.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-zinc-700 text-sm mb-4">No lent entries yet.</p>
                            <button onClick={() => setAddMode('lent')} className="text-blue-500 text-sm">Add first entry →</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {lents.map(l => (
                                <div key={l.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${l.returned ? 'bg-green-400' : 'bg-amber-400'}`} />
                                        <div>
                                            <p className="text-xs text-zinc-300 font-medium">{l.person_name}</p>
                                            <p className="text-xs text-zinc-600">{l.reason || 'No reason'} · {l.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className={`text-sm font-medium ${l.returned ? 'text-zinc-600 line-through' : 'text-amber-400'}`}>
                                            ₹{l.amount.toLocaleString('en-IN')}
                                        </p>
                                        <button
                                            onClick={() => toggleReturned(l.id, l.returned)}
                                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${l.returned ? 'bg-zinc-800 text-zinc-600' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`}>
                                            {l.returned ? 'Returned' : 'Mark returned'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="mb-8">
                <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">
                    {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
                <h2 className="text-2xl font-semibold text-white">Finance</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div
                    onClick={() => setView('expenses')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-600 transition-colors group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-zinc-600 uppercase tracking-wider">Expenses</p>
                        <span className="text-zinc-700 group-hover:text-zinc-400 transition-colors text-xs">→</span>
                    </div>
                    <p className="text-2xl font-semibold text-red-400 mb-1">
                        ₹{totalExpenses.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-zinc-700">this month</p>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-600">
                            Income: <span className="text-green-400">₹{totalIncome.toLocaleString('en-IN')}</span>
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                            Balance: <span className="text-blue-400">₹{(totalIncome - totalExpenses).toLocaleString('en-IN')}</span>
                        </p>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); setAddMode('expense') }}
                        className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        + Add expense
                    </button>
                </div>

                <div
                    onClick={() => setView('savings')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-600 transition-colors group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-zinc-600 uppercase tracking-wider">Savings</p>
                        <span className="text-zinc-700 group-hover:text-zinc-400 transition-colors text-xs">→</span>
                    </div>
                    <p className="text-2xl font-semibold text-green-400 mb-1">
                        ₹{totalSavings.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-zinc-700">total portfolio</p>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-600">
                            {savings.length} active investment{savings.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); setAddMode('saving') }}
                        className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        + Add investment
                    </button>
                </div>

                <div
                    onClick={() => setView('lent')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-600 transition-colors group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-zinc-600 uppercase tracking-wider">Lent</p>
                        <span className="text-zinc-700 group-hover:text-zinc-400 transition-colors text-xs">→</span>
                    </div>
                    <p className="text-2xl font-semibold text-amber-400 mb-1">
                        ₹{totalLent.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-zinc-700">outstanding</p>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-600">
                            {lents.filter(l => !l.returned).length} pending return{lents.filter(l => !l.returned).length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); setAddMode('lent') }}
                        className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        + Add lent entry
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">Recent transactions</p>
                {monthly.length === 0 ? (
                    <p className="text-zinc-700 text-sm text-center py-6">No transactions this month.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {monthly.slice(0, 8).map(t => (
                            <div key={t.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
                                    <div>
                                        <p className="text-xs text-zinc-300">{t.description || t.category}</p>
                                        <p className="text-xs text-zinc-600">{t.category} · {t.date}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
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