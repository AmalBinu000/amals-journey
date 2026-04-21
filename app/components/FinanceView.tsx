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
    return_date: string | null
    returned: boolean
}

type Debt = {
    id: number
    person_name: string
    amount: number
    reason: string
    date: string
    return_date: string | null
    returned: boolean
}

const EXPENSE_CATEGORIES = [
    'Food', 'Transport', 'Rent', 'Learning',
    'Entertainment', 'Health', 'Shopping',
    'Family', 'Subscriptions', 'EMI', 'Other'
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
    const [debts, setDebts] = useState<Debt[]>([])
    const [view, setView] = useState<'overview' | 'expenses' | 'savings' | 'lent'>('overview')
    const [addMode, setAddMode] = useState<'expense' | 'saving' | 'lent' | 'debt' | null>(null)
    const [editItem, setEditItem] = useState<{ table: string, item: any } | null>(null)
    const [bulkMode, setBulkMode] = useState(false)
    const [bulkRows, setBulkRows] = useState([
        { date: new Date().toISOString().split('T')[0], description: '', category: 'Food', amount: '' }
    ])

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
    const [lentReturnDate, setLentReturnDate] = useState('')
    const [debtPerson, setDebtPerson] = useState('')
    const [debtReason, setDebtReason] = useState('')
    const [debtReturnDate, setDebtReturnDate] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        const [t, s, l, d] = await Promise.all([
            supabase.from('finances').select('*').order('date', { ascending: false }),
            supabase.from('savings').select('*').order('date', { ascending: false }),
            supabase.from('lent').select('*').order('date', { ascending: false }),
            supabase.from('debts').select('*').order('date', { ascending: false })
        ])
        if (t.data) setTransactions(t.data)
        if (s.data) setSavings(s.data)
        if (l.data) setLents(l.data)
        if (d.data) setDebts(d.data)
    }

    async function deleteItem(table: string, id: number) {
        if (!confirm('Are you sure you want to delete this?')) return
        await supabase.from(table).delete().eq('id', id)
        await fetchAll()
    }

    async function startEdit(table: string, item: any) {
        setEditItem({ table, item })
        if (table === 'finances') {
            setExpenseType(item.type)
            setAmount(String(item.amount))
            setCategory(item.category)
            setDescription(item.description || '')
            setDate(item.date)
            setAddMode('expense')
        } else if (table === 'savings') {
            setSavingName(item.name)
            setSavingType(item.type)
            setAmount(String(item.amount))
            setDate(item.date)
            setSavingNotes(item.notes || '')
            setAddMode('saving')
        } else if (table === 'lent') {
            setLentPerson(item.person_name)
            setLentReason(item.reason || '')
            setAmount(String(item.amount))
            setDate(item.date)
            setLentReturnDate(item.return_date || '')
            setAddMode('lent')
        } else if (table === 'debts') {
            setDebtPerson(item.person_name)
            setDebtReason(item.reason || '')
            setAmount(String(item.amount))
            setDate(item.date)
            setDebtReturnDate(item.return_date || '')
            setAddMode('debt')
        }
    }

    function clearForm() {
        setAmount(''); setCategory('Food'); setDescription('')
        setDate(new Date().toISOString().split('T')[0])
        setSavingName(''); setSavingNotes('')
        setLentPerson(''); setLentReason(''); setLentReturnDate('')
        setDebtPerson(''); setDebtReason(''); setDebtReturnDate('')
        setEditItem(null)
    }

    async function saveExpense() {
        if (!amount || isNaN(Number(amount))) return
        setSaving(true)
        const data = { type: expenseType, amount: Number(amount), category: expenseType === 'income' ? 'Salary' : category, description, date }
        if (editItem) {
            await supabase.from('finances').update(data).eq('id', editItem.item.id)
        } else {
            await supabase.from('finances').insert([data])
        }
        clearForm(); await fetchAll(); setSaving(false); setAddMode(null)
    }

    async function saveSaving() {
        if (!savingName.trim() || !amount || isNaN(Number(amount))) return
        setSaving(true)
        const data = { name: savingName, type: savingType, amount: Number(amount), date, notes: savingNotes }
        if (editItem) {
            await supabase.from('savings').update(data).eq('id', editItem.item.id)
        } else {
            await supabase.from('savings').insert([data])
        }
        clearForm(); await fetchAll(); setSaving(false); setAddMode(null)
    }

    async function saveLent() {
        if (!lentPerson.trim() || !amount || isNaN(Number(amount))) return
        setSaving(true)
        const data = { person_name: lentPerson, amount: Number(amount), reason: lentReason, date, return_date: lentReturnDate || null }
        if (editItem) {
            await supabase.from('lent').update(data).eq('id', editItem.item.id)
        } else {
            await supabase.from('lent').insert([data])
        }
        clearForm(); await fetchAll(); setSaving(false); setAddMode(null)
    }

    async function saveDebt() {
        if (!debtPerson.trim() || !amount || isNaN(Number(amount))) return
        setSaving(true)
        const data = { person_name: debtPerson, amount: Number(amount), reason: debtReason, date, return_date: debtReturnDate || null }
        if (editItem) {
            await supabase.from('debts').update(data).eq('id', editItem.item.id)
        } else {
            await supabase.from('debts').insert([data])
        }
        clearForm(); await fetchAll(); setSaving(false); setAddMode(null)
    }

    async function saveBulkExpenses() {
        const valid = bulkRows.filter(r => r.description.trim() && r.amount && !isNaN(Number(r.amount)))
        if (valid.length === 0) return
        setSaving(true)
        await supabase.from('finances').insert(valid.map(r => ({ type: 'expense', amount: Number(r.amount), category: r.category, description: r.description, date: r.date })))
        setBulkRows([{ date: new Date().toISOString().split('T')[0], description: '', category: 'Food', amount: '' }])
        await fetchAll(); setSaving(false); setAddMode(null); setBulkMode(false)
    }

    function addBulkRow() {
        setBulkRows(prev => [...prev, { date: prev[prev.length - 1].date, description: '', category: 'Food', amount: '' }])
    }

    function updateBulkRow(index: number, field: string, value: string) {
        setBulkRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
    }

    function removeBulkRow(index: number) {
        setBulkRows(prev => prev.filter((_, i) => i !== index))
    }

    async function toggleReturned(table: string, id: number, returned: boolean) {
        await supabase.from(table).update({ returned: !returned }).eq('id', id)
        await fetchAll()
    }

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthly = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear })
    const totalIncome = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalSavings = savings.reduce((s, t) => s + t.amount, 0)
    const totalLent = lents.filter(l => !l.returned).reduce((s, l) => s + l.amount, 0)
    const totalDebt = debts.filter(d => !d.returned).reduce((s, d) => s + d.amount, 0)
    const expensesByCategory = EXPENSE_CATEGORIES.map(cat => ({ category: cat, amount: monthly.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0) })).filter(c => c.amount > 0)

    const ActionButtons = ({ table, item }: { table: string, item: any }) => (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => startEdit(table, item)} className="text-xs text-zinc-500 hover:text-blue-400 transition-colors">Edit</button>
            <button onClick={() => deleteItem(table, item.id)} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">Delete</button>
        </div>
    )

    if (addMode) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { setAddMode(null); clearForm(); setBulkMode(false) }}
                            className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors">← Back</button>
                        <span className="text-xs text-zinc-600 uppercase tracking-widest">
                            {editItem ? 'Edit' : 'Add'} {addMode === 'expense' ? 'Transaction' : addMode === 'saving' ? 'Investment' : addMode === 'lent' ? 'Lent Entry' : 'Debt Entry'}
                        </span>
                    </div>
                    {addMode === 'expense' && !editItem && (
                        <button onClick={() => setBulkMode(!bulkMode)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${bulkMode ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                            {bulkMode ? 'Single mode' : 'Bulk mode'}
                        </button>
                    )}
                </div>

                {addMode === 'expense' && !bulkMode && (
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <button onClick={() => { setExpenseType('expense'); setCategory('Food') }}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${expenseType === 'expense' ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Expense</button>
                            <button onClick={() => setExpenseType('income')}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${expenseType === 'income' ? 'bg-green-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Income</button>
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
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}>{cat}</button>
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
                            {saving ? 'Saving...' : editItem ? 'Update' : `Add ${expenseType === 'income' ? 'Income' : 'Expense'}`}
                        </button>
                    </div>
                )}

                {addMode === 'expense' && bulkMode && (
                    <div>
                        <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                            <p className="col-span-2 text-xs text-zinc-600 uppercase tracking-wider">Date</p>
                            <p className="col-span-4 text-xs text-zinc-600 uppercase tracking-wider">Description</p>
                            <p className="col-span-3 text-xs text-zinc-600 uppercase tracking-wider">Category</p>
                            <p className="col-span-2 text-xs text-zinc-600 uppercase tracking-wider">Amount</p>
                            <p className="col-span-1"></p>
                        </div>
                        <div className="flex flex-col gap-2 mb-4">
                            {bulkRows.map((row, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                    <input className="col-span-2 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-500 text-white"
                                        type="date" value={row.date} onChange={e => updateBulkRow(i, 'date', e.target.value)} />
                                    <input className="col-span-4 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                        placeholder="Description..." value={row.description} onChange={e => updateBulkRow(i, 'description', e.target.value)} />
                                    <select className="col-span-3 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-500 text-white"
                                        value={row.category} onChange={e => updateBulkRow(i, 'category', e.target.value)}>
                                        {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                    <input className="col-span-2 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                        placeholder="₹0" type="number" value={row.amount} onChange={e => updateBulkRow(i, 'amount', e.target.value)} />
                                    <button onClick={() => removeBulkRow(i)} className="col-span-1 text-zinc-700 hover:text-red-400 text-xs transition-colors text-center">✕</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={addBulkRow}
                                className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-lg text-xs transition-colors">+ Add row</button>
                            <button onClick={saveBulkExpenses} disabled={saving}
                                className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 px-6 py-2 rounded-lg text-xs font-medium transition-colors">
                                {saving ? 'Saving...' : `Save all ${bulkRows.filter(r => r.description && r.amount).length} entries`}
                            </button>
                        </div>
                        <p className="text-xs text-zinc-700 mt-4">Tip — press Tab to jump between fields</p>
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
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${savingType === t.value ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}>{t.label}</button>
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
                            {saving ? 'Saving...' : editItem ? 'Update' : 'Add Investment'}
                        </button>
                    </div>
                )}

                {(addMode === 'lent' || addMode === 'debt') && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">
                                {addMode === 'lent' ? 'Person you lent to' : 'Person you borrowed from'}
                            </p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="Name..."
                                value={addMode === 'lent' ? lentPerson : debtPerson}
                                onChange={e => addMode === 'lent' ? setLentPerson(e.target.value) : setDebtPerson(e.target.value)} autoFocus />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Amount (₹)</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-2xl font-medium outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} type="number" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Date borrowed</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white"
                                type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Expected return date (optional)</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white"
                                type="date"
                                value={addMode === 'lent' ? lentReturnDate : debtReturnDate}
                                onChange={e => addMode === 'lent' ? setLentReturnDate(e.target.value) : setDebtReturnDate(e.target.value)} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Reason (optional)</p>
                            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-white placeholder-zinc-700"
                                placeholder="For what purpose?"
                                value={addMode === 'lent' ? lentReason : debtReason}
                                onChange={e => addMode === 'lent' ? setLentReason(e.target.value) : setDebtReason(e.target.value)} />
                        </div>
                        <button onClick={addMode === 'lent' ? saveLent : saveDebt} disabled={saving}
                            className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 py-3 rounded-xl text-sm font-medium transition-colors mt-2">
                            {saving ? 'Saving...' : editItem ? 'Update' : addMode === 'lent' ? 'Add Lent Entry' : 'Add Debt Entry'}
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
                        <button onClick={() => setView('overview')} className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors">← Back</button>
                        <h2 className="text-2xl font-semibold text-white">Expenses</h2>
                    </div>
                    <button onClick={() => setAddMode('expense')}
                        className="border border-zinc-700 hover:border-zinc-400 text-zinc-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">+ Add</button>
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
                        <div className="flex flex-col gap-1">
                            {monthly.map(t => (
                                <div key={t.id} className="group flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
                                        <div>
                                            <p className="text-xs text-zinc-300">{t.description || t.category}</p>
                                            <p className="text-xs text-zinc-600">{t.category} · {t.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ActionButtons table="finances" item={t} />
                                        <p className={`text-sm font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
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
                        <button onClick={() => setView('overview')} className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors">← Back</button>
                        <h2 className="text-2xl font-semibold text-white">Savings & Investments</h2>
                    </div>
                    <button onClick={() => setAddMode('saving')}
                        className="border border-zinc-700 hover:border-zinc-400 text-zinc-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">+ Add</button>
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
                        <div className="flex flex-col gap-1">
                            {savings.map(s => (
                                <div key={s.id} className="group flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                                    <div>
                                        <p className="text-xs text-zinc-300 font-medium">{s.name}</p>
                                        <p className="text-xs text-zinc-600">{SAVING_TYPES.find(t => t.value === s.type)?.label} · {s.date}</p>
                                        {s.notes && <p className="text-xs text-zinc-700 mt-0.5">{s.notes}</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ActionButtons table="savings" item={s} />
                                        <p className="text-sm font-medium text-green-400">₹{s.amount.toLocaleString('en-IN')}</p>
                                    </div>
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
                        <button onClick={() => setView('overview')} className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors">← Back</button>
                        <h2 className="text-2xl font-semibold text-white">Lent & Debts</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setAddMode('lent')}
                            className="border border-amber-700 hover:border-amber-500 text-amber-400 px-4 py-2 rounded-full text-xs font-medium transition-colors">+ Lent</button>
                        <button onClick={() => setAddMode('debt')}
                            className="border border-red-800 hover:border-red-600 text-red-400 px-4 py-2 rounded-full text-xs font-medium transition-colors">+ Debt</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Others owe me</p>
                        <p className="text-2xl font-semibold text-amber-400">₹{totalLent.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-zinc-700 mt-1">{lents.filter(l => !l.returned).length} pending</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">I owe others</p>
                        <p className="text-2xl font-semibold text-red-400">₹{totalDebt.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-zinc-700 mt-1">{debts.filter(d => !d.returned).length} pending</p>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">Money others owe me</p>
                    {lents.length === 0 ? (
                        <p className="text-zinc-700 text-sm text-center py-4">No lent entries.</p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {lents.map(l => (
                                <div key={l.id} className="group flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${l.returned ? 'bg-green-400' : 'bg-amber-400'}`} />
                                        <div>
                                            <p className="text-xs text-zinc-300 font-medium">{l.person_name}</p>
                                            <p className="text-xs text-zinc-600">
                                                {l.reason || 'No reason'} · {l.date}
                                                {l.return_date && ` · Return by: ${l.return_date}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ActionButtons table="lent" item={l} />
                                        <p className={`text-sm font-medium ${l.returned ? 'text-zinc-600 line-through' : 'text-amber-400'}`}>
                                            ₹{l.amount.toLocaleString('en-IN')}
                                        </p>
                                        <button onClick={() => toggleReturned('lent', l.id, l.returned)}
                                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${l.returned ? 'bg-zinc-800 text-zinc-600' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`}>
                                            {l.returned ? 'Returned' : 'Mark returned'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">Money I owe others</p>
                    {debts.length === 0 ? (
                        <p className="text-zinc-700 text-sm text-center py-4">No debt entries.</p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {debts.map(d => (
                                <div key={d.id} className="group flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${d.returned ? 'bg-green-400' : 'bg-red-400'}`} />
                                        <div>
                                            <p className="text-xs text-zinc-300 font-medium">{d.person_name}</p>
                                            <p className="text-xs text-zinc-600">
                                                {d.reason || 'No reason'} · {d.date}
                                                {d.return_date && ` · Return by: ${d.return_date}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ActionButtons table="debts" item={d} />
                                        <p className={`text-sm font-medium ${d.returned ? 'text-zinc-600 line-through' : 'text-red-400'}`}>
                                            ₹{d.amount.toLocaleString('en-IN')}
                                        </p>
                                        <button onClick={() => toggleReturned('debts', d.id, d.returned)}
                                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${d.returned ? 'bg-zinc-800 text-zinc-600' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
                                            {d.returned ? 'Paid back' : 'Mark paid'}
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
                <div onClick={() => setView('expenses')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-600 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-zinc-600 uppercase tracking-wider">Expenses</p>
                        <span className="text-zinc-700 group-hover:text-zinc-400 text-xs">→</span>
                    </div>
                    <p className="text-2xl font-semibold text-red-400 mb-1">₹{totalExpenses.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-zinc-700">this month</p>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-600">Income: <span className="text-green-400">₹{totalIncome.toLocaleString('en-IN')}</span></p>
                        <p className="text-xs text-zinc-600 mt-1">Balance: <span className="text-blue-400">₹{(totalIncome - totalExpenses).toLocaleString('en-IN')}</span></p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setAddMode('expense') }}
                        className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors">+ Add expense</button>
                </div>

                <div onClick={() => setView('savings')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-600 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-zinc-600 uppercase tracking-wider">Savings</p>
                        <span className="text-zinc-700 group-hover:text-zinc-400 text-xs">→</span>
                    </div>
                    <p className="text-2xl font-semibold text-green-400 mb-1">₹{totalSavings.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-zinc-700">total portfolio</p>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-600">{savings.length} active investment{savings.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setAddMode('saving') }}
                        className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors">+ Add investment</button>
                </div>

                <div onClick={() => setView('lent')}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-600 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-zinc-600 uppercase tracking-wider">Lent & Debts</p>
                        <span className="text-zinc-700 group-hover:text-zinc-400 text-xs">→</span>
                    </div>
                    <div className="flex gap-4 mb-1">
                        <div>
                            <p className="text-lg font-semibold text-amber-400">₹{totalLent.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-zinc-700">owed to me</p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-red-400">₹{totalDebt.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-zinc-700">I owe</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-600">{lents.filter(l => !l.returned).length + debts.filter(d => !d.returned).length} pending</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button onClick={e => { e.stopPropagation(); setAddMode('lent') }}
                            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-amber-400 transition-colors">+ Lent</button>
                        <button onClick={e => { e.stopPropagation(); setAddMode('debt') }}
                            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-red-400 transition-colors">+ Debt</button>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-600 uppercase tracking-wider mb-4">Recent transactions</p>
                {monthly.length === 0 ? (
                    <p className="text-zinc-700 text-sm text-center py-6">No transactions this month.</p>
                ) : (
                    <div className="flex flex-col gap-1">
                        {monthly.slice(0, 8).map(t => (
                            <div key={t.id} className="group flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
                                    <div>
                                        <p className="text-xs text-zinc-300">{t.description || t.category}</p>
                                        <p className="text-xs text-zinc-600">{t.category} · {t.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ActionButtons table="finances" item={t} />
                                    <p className={`text-sm font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}