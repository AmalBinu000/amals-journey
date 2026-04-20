'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '@/lib/supabase'
import JournalView from '@/app/components/JournalView'

type Message = { role: 'user' | 'assistant', content: string }
type Task = { id: number, text: string, completed: boolean }

export default function Home() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [view, setView] = useState<'dashboard' | 'journal'>('dashboard')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTasks()
    fetchMessages()
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
    if (!input.trim() || loading) return
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: input }
    ]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    await supabase.from('messages').insert([{
      role: 'user', content: input
    }])
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, tasks })
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
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
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

            <div className="border-t border-zinc-800 px-6 py-4 flex gap-3">
              <input
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors placeholder-zinc-600"
                placeholder="Message Jarvis..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-5 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'journal' && (
        <div className="flex-1 p-6 overflow-y-auto">
          <JournalView />
        </div>
      )}
    </main>
  )
}