'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '@/lib/supabase'
import JournalView from '@/app/components/JournalView'
import FinanceView from './components/FinanceView'

type Message = { role: 'user' | 'assistant', content: string, imageUrl?: string }
type Task = { id: number, text: string, completed: boolean }

export default function Home() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [journal, setJournal] = useState<{ title: string, content: string, type: string }[]>([])
  const [finances, setFinances] = useState<{ type: string, amount: number, category: string, description: string, date: string }[]>([])
  const [savingsData, setSavingsData] = useState<{ name: string, type: string, amount: number }[]>([])
  const [lentData, setLentData] = useState<{ person_name: string, amount: number, returned: boolean, return_date: string | null }[]>([])
  const [newTask, setNewTask] = useState('')
  const [view, setView] = useState<'dashboard' | 'journal' | 'finance'>('dashboard')
  const [chatImage, setChatImage] = useState<File | null>(null)
  const [chatImagePreview, setChatImagePreview] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTasks()
    fetchMessages()
    fetchJournal()
    fetchFinances()
    fetchSavingsData()
    fetchLentData()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setTasks(data)
  }

  async function fetchJournal() {
    const { data } = await supabase
      .from('journal')
      .select('title, content, type')
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setJournal(data)
  }

  async function fetchFinances() {
    const { data } = await supabase
      .from('finances')
      .select('type, amount, category, description, date')
      .order('date', { ascending: false })
    if (data) setFinances(data)
  }

  async function fetchSavingsData() {
    const { data } = await supabase
      .from('savings')
      .select('name, type, amount')
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setSavingsData(data)
  }

  async function fetchLentData() {
    const { data } = await supabase
      .from('lent')
      .select('person_name, amount, returned, return_date')
      .eq('returned', false)
      .limit(10)
    if (data) setLentData(data)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setMessages(data.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })))
  }

  async function addTask() {
    if (!newTask.trim()) return
    const { data } = await supabase
      .from('tasks')
      .insert([{ text: newTask, completed: false }])
      .select()
    if (data) setTasks(prev => [...prev, data[0]])
    setNewTask('')
  }

  async function toggleTask(id: number, completed: boolean) {
    await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', id)
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !completed } : t
    ))
  }

  async function deleteTask(id: number) {
    await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function sendMessage() {
    if (loading) return
    if (!input.trim() && !chatImage) return
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: input, imageUrl: chatImagePreview || undefined }
    ]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    await supabase.from('messages').insert([{
      role: 'user', content: input
    }])
    try {
      let imageBase64 = ''
      let imageType = ''

      if (chatImage) {
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            resolve(result.split(',')[1])
          }
          reader.readAsDataURL(chatImage)
        })
        imageType = chatImage.type
        setChatImage(null)
        setChatImagePreview('')
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages, tasks, journal,
          finances, savingsData, lentData,
          imageBase64, imageType
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }])
      await supabase.from('messages').insert([{
        role: 'assistant', content: data.response
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection lost. Stand by.'
      }])

    } finally {
      setLoading(false)
    }
  }

  const completedCount = tasks.filter(t => t.completed).length

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3 sticky top-0 z-50 bg-zinc-950">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <h1 className="text-lg font-semibold tracking-wide">Amal's Journey</h1>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'dashboard'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView('journal')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'journal'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Journal
          </button>
          <button
            onClick={() => setView('finance')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'finance'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Finance
          </button>
        </div>
      </div>

      {view === 'dashboard' && (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 border-r border-zinc-800 flex flex-col p-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                Daily Tasks
              </p>
              <p className="text-xs text-zinc-600">
                {completedCount}/{tasks.length} completed
              </p>
              {tasks.length > 0 && (
                <div className="w-full bg-zinc-800 rounded-full h-1 mt-2">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all"
                    style={{ width: `${(completedCount / tasks.length) * 100}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 transition-colors placeholder-zinc-600"
                placeholder="Add a task..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
              />
              <button
                onClick={addTask}
                className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {tasks.length === 0 && (
                <p className="text-xs text-zinc-700 text-center mt-8">
                  No tasks yet. Add one above.
                </p>
              )}
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800 group"
                >
                  <button
                    onClick={() => toggleTask(task.id, task.completed)}
                    className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 transition-colors ${task.completed
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-zinc-600 hover:border-blue-500'
                      }`}
                  />
                  <span className={`text-xs flex-1 leading-relaxed ${task.completed ? 'line-through text-zinc-600' : 'text-zinc-300'
                    }`}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-zinc-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="text-center text-zinc-600 mt-20 text-sm">
                  Good day, Amal. How can I assist you?
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col gap-1 max-w-2xl ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}>
                  <span className="text-xs text-zinc-600 px-1">
                    {m.role === 'user' ? 'Amal' : 'Jarvis'}
                  </span>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                    }`}>
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="" className="rounded-lg mb-2 max-w-xs max-h-48 object-cover" />
                    )}
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="self-start flex flex-col gap-1">
                  <span className="text-xs text-zinc-600 px-1">Jarvis</span>
                  <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1 items-center h-4">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-zinc-800 px-6 py-4">
              <div className="max-w-4xl mx-auto">
                <div className="bg-zinc-900 border border-zinc-700 rounded-2xl focus-within:border-blue-500 transition-colors">
                  <textarea
                    className="w-full bg-transparent px-4 pt-4 pb-2 text-sm outline-none placeholder-zinc-600 text-white resize-none min-h-[56px] max-h-[200px]"
                    placeholder="Message Jarvis..."
                    value={input}
                    rows={1}
                    onChange={e => {
                      setInput(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
                    }}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  />
                  <div className="flex items-center justify-between px-4 pb-3">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer text-zinc-600 hover:text-zinc-300 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setChatImage(file)
                              setChatImagePreview(URL.createObjectURL(file))
                            }
                          }}
                        />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </label>
                      {chatImagePreview && (
                        <div className="relative">
                          <img src={chatImagePreview} alt="" className="h-8 w-8 rounded-lg object-cover" />
                          <button
                            type="button"
                            onClick={() => { setChatImage(null); setChatImagePreview('') }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                          >✕</button>
                        </div>
                      )}
                      {!chatImagePreview && (
                        <p className="text-xs text-zinc-700">Enter to send · Shift+Enter for new line</p>
                      )}
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={loading || (!input.trim() && !chatImage)}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'journal' && (
        <div className="flex-1 p-6 overflow-y-auto">
          <JournalView />
        </div>
      )}
      {view === 'finance' && (
        <div className="flex-1 p-6 overflow-y-auto">
          <FinanceView />
        </div>
      )}
    </main>
  )
}