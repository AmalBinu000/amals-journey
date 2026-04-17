'use client'
import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!message.trim() || loading) return
    const userMessage = message
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setMessage('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'jarvis', text: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'jarvis', text: 'Connection lost. Stand by.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col">

      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <h1 className="text-lg font-semibold tracking-wide">Amal's Journey</h1>
        <span className="text-xs text-zinc-500 ml-auto">Jarvis online</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-600 mt-20 text-sm">
            Good day, Amal. How can I assist you?
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1 max-w-2xl ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
            <span className="text-xs text-zinc-600 px-1">
              {m.role === 'user' ? 'Amal' : 'Jarvis'}
            </span>
            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
              }`}>
              {m.text}
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
          value={message}
          onChange={e => setMessage(e.target.value)}
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
    </main>
  )
}