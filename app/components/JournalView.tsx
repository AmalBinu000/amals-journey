'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Entry = {
    id: number
    type: string
    title: string
    content: string
    image_url?: string | null
    created_at: string
}

export default function JournalView() {
    const [entries, setEntries] = useState<Entry[]>([])
    const [tab, setTab] = useState<'dev' | 'body'>('dev')
    const [mode, setMode] = useState<'read' | 'write'>('read')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [saving, setSaving] = useState(false)
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')

    useEffect(() => { fetchEntries() }, [])

    async function fetchEntries() {
        const { data } = await supabase
            .from('journal')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setEntries(data)
    }

    async function saveEntry() {
        if (!title.trim() || !content.trim()) return
        setSaving(true)

        let image_url = ''

        if (image) {
            const fileName = `${Date.now()}-${image.name}`
            const { data } = await supabase.storage
                .from('journal-images')
                .upload(fileName, image)
            if (data) {
                const { data: urlData } = supabase.storage
                    .from('journal-images')
                    .getPublicUrl(fileName)
                image_url = urlData.publicUrl
            }
        }

        await supabase.from('journal').insert([{
            type: tab,
            title,
            content,
            image_url: image_url || null
        }])

        setTitle('')
        setContent('')
        setImage(null)
        setImagePreview('')
        await fetchEntries()
        setSaving(false)
        setMode('read')
    }

    const filtered = entries.filter(e => e.type === tab)
    const hero = filtered[0]
    const rest = filtered.slice(1)

    if (mode === 'write') {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => setMode('read')}
                        className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors"
                    >
                        ← Back
                    </button>
                    <span className="text-xs text-zinc-600 uppercase tracking-widest">
                        New {tab === 'dev' ? 'Dev' : 'Body'} Entry
                    </span>
                </div>
                <div className="flex flex-col gap-5">
                    <input
                        className="w-full bg-transparent border-b border-zinc-700 py-3 text-2xl font-medium outline-none focus:border-blue-500 transition-colors placeholder-zinc-700 text-white"
                        placeholder="Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        autoFocus
                    />
                    <textarea
                        className="w-full bg-transparent py-3 text-sm text-zinc-300 outline-none placeholder-zinc-700 resize-none leading-relaxed"
                        placeholder={tab === 'dev'
                            ? 'What did you build today? What did you learn? What was hard?'
                            : 'How was your workout? What did you eat? How does your body feel?'
                        }
                        rows={14}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                    <div className="border border-zinc-700 border-dashed rounded-xl p-4 text-center">
                        {imagePreview ? (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="preview"
                                    className="w-full h-48 object-cover rounded-lg mb-2"
                                />
                                <button
                                    onClick={() => { setImage(null); setImagePreview('') }}
                                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    Remove image
                                </button>
                            </div>
                        ) : (
                            <label className="cursor-pointer">
                                <p className="text-zinc-600 text-sm mb-2">
                                    Click to add an image
                                </p>
                                <p className="text-zinc-700 text-xs">
                                    PNG, JPG up to 50MB
                                </p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setImage(file)
                                            setImagePreview(URL.createObjectURL(file))
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2 border-t border-zinc-800">
                        <button
                            onClick={saveEntry}
                            disabled={saving}
                            className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
                        >
                            {saving ? 'Saving...' : 'Publish Entry'}
                        </button>
                        <button
                            onClick={() => setMode('read')}
                            className="text-zinc-500 hover:text-zinc-300 px-4 py-2.5 text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-10">
                <div className="flex gap-1">
                    <button
                        onClick={() => setTab('dev')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'dev'
                            ? 'bg-white text-black'
                            : 'text-zinc-500 hover:text-zinc-200'
                            }`}
                    >
                        Dev Log
                    </button>
                    <button
                        onClick={() => setTab('body')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'body'
                            ? 'bg-white text-black'
                            : 'text-zinc-500 hover:text-zinc-200'
                            }`}
                    >
                        Body Log
                    </button>
                </div>
                <button
                    onClick={() => setMode('write')}
                    className="border border-zinc-700 hover:border-zinc-400 text-zinc-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
                >
                    + New Entry
                </button>
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-32">
                    <p className="text-zinc-700 text-sm mb-6">
                        No {tab === 'dev' ? 'dev' : 'body'} entries yet.
                    </p>
                    <button
                        onClick={() => setMode('write')}
                        className="text-white border border-zinc-700 hover:border-zinc-400 px-6 py-2.5 rounded-full text-sm transition-colors"
                    >
                        Write your first entry →
                    </button>
                </div>
            )}

            {hero && (
                <div className="mb-8 pb-8 border-b border-zinc-800">
                    <span className="text-xs text-zinc-600 uppercase tracking-widest mb-4 block">
                        Latest
                    </span>
                    <div className="flex items-start justify-between gap-8">
                        <div className="flex-1">
                            <h2 className="text-3xl font-semibold text-white mb-4 leading-tight">
                                {hero.title}
                            </h2>
                            <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 mb-6">
                                {hero.content}
                            </p>
                            <span className="text-xs text-zinc-700">
                                {new Date(hero.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className="w-48 h-32 bg-zinc-900 rounded-xl border border-zinc-800 flex-shrink-0 overflow-hidden">
                            {hero.image_url ? (
                                <img
                                    src={hero.image_url}
                                    alt={hero.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-zinc-700 text-xs">No image yet</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {rest.length > 0 && (
                <div className="grid grid-cols-2 gap-6">
                    {rest.map(entry => (
                        <div
                            key={entry.id}
                            className="group cursor-pointer"
                        >
                            <div className="w-full h-36 bg-zinc-900 rounded-xl border border-zinc-800 mb-4 overflow-hidden group-hover:border-zinc-700 transition-colors">
                                {entry.image_url ? (
                                    <img
                                        src={entry.image_url}
                                        alt={entry.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-zinc-700 text-xs">No image yet</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-zinc-700 mb-2 block">
                                {new Date(entry.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                })}
                            </span>
                            <h3 className="text-sm font-medium text-white mb-2 group-hover:text-zinc-300 transition-colors">
                                {entry.title}
                            </h3>
                            <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                                {entry.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}