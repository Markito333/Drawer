'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createNote, createTask } from '@/lib/storage'
import { CheckIcon, SubTaskIcon, PencilIcon } from './Icons'
import CloseButton from './CloseButton'

function keyToNoon(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).getTime()
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map(block => block.split('\n').map(l => l.trim()).filter(Boolean))
    .filter(lines => lines.length > 0)
    .map(lines => `<p>${escapeHtml(lines.join('<br>'))}</p>`)
    .join('')
}

interface Line {
  id: string
  text: string
  completed: boolean
}

interface Props {
  kind: 'note' | 'task'
  dayKey: string
  onClose: () => void
}

export default function QuickCreate({ kind, dayKey, onClose }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'check' | 'text'>('check')
  const [lines, setLines] = useState<Line[]>([{ id: crypto.randomUUID(), text: '', completed: false }])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const paperRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const setLineText = (id: string, value: string) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, text: value } : l))
  }

  const toggleLine = (id: string) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, completed: !l.completed } : l))
  }

  const handleLineKey = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = [...lines]
      next.splice(index + 1, 0, { id: crypto.randomUUID(), text: '', completed: false })
      setLines(next)
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0)
    } else if (e.key === 'Backspace' && lines[index].text === '' && lines.length > 1) {
      e.preventDefault()
      setLines(lines.filter((_, i) => i !== index))
      setTimeout(() => inputRefs.current[Math.max(0, index - 1)]?.focus(), 0)
    }
  }

  const handleSave = () => {
    if (!title.trim()) {
      titleRef.current?.focus()
      return
    }

    if (kind === 'note') {
      const ts = keyToNoon(dayKey)
      const id = crypto.randomUUID()
      createNote({
        id,
        title: title.trim(),
        content: textToHtml(text),
        images: [],
        imageCaptions: {},
        folderId: null,
        createdAt: ts,
        updatedAt: ts,
      })
      onClose()
      router.push(`/notes/${id}`)
      return
    }

    const id = crypto.randomUUID()
    createTask({
      id,
      title: title.trim(),
      description: mode === 'text' ? textToHtml(text) : '',
      completed: false,
      status: 'new',
      subtasks: mode === 'check'
        ? lines.filter(l => l.text.trim()).map(l => ({ id: l.id, text: l.text.trim(), completed: l.completed }))
        : [],
      images: [],
      imageCaptions: {},
      dueDate: keyToNoon(dayKey),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    onClose()
    router.push('/tasks')
  }

  const doneCount = lines.filter(l => l.text.trim() && l.completed).length
  const filledCount = lines.filter(l => l.text.trim()).length

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 dark:bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-100 dark:bg-zinc-800/95 rounded-2xl shadow-xl w-full max-w-lg p-4 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {kind === 'note' ? 'Nueva nota' : 'Nueva tarea'}
          </p>
          <CloseButton onClick={onClose} />
        </div>

        {kind === 'task' && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-900/60 mb-3 shrink-0">
            <button
              onClick={() => setMode('check')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === 'check'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <SubTaskIcon className="w-3.5 h-3.5" />
              Insertar tarea
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === 'text'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <PencilIcon className="w-3.5 h-3.5" />
              Modo texto
            </button>
          </div>
        )}

        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm flex flex-col min-h-0 flex-1">
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (kind === 'note') paperRef.current?.focus()
                else inputRefs.current[0]?.focus()
              }
            }}
            placeholder="Título"
            className="bg-transparent border-none outline-none text-base font-semibold text-zinc-800 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 w-full mb-3"
          />

          {kind === 'note' && (
            <textarea
              ref={paperRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Escribe libremente..."
              className="flex-1 min-h-[45vh] bg-transparent border-none outline-none resize-none text-sm leading-7 text-zinc-600 dark:text-zinc-300 placeholder-zinc-300 dark:placeholder-zinc-600 w-full"
            />
          )}

          {kind === 'task' && mode === 'check' && (
            <div className="flex-1 min-h-[45vh] overflow-y-auto space-y-1">
              {lines.map((l, i) => (
                <div key={l.id} className="flex items-start gap-2">
                  <button
                    onClick={() => toggleLine(l.id)}
                    className="mt-1 shrink-0 w-4 h-4 flex items-center justify-center"
                  >
                    {l.completed
                      ? <CheckIcon className="w-4 h-4 text-green-500" />
                      : <span className="w-3.5 h-3.5 rounded border border-zinc-300 dark:border-zinc-600 block" />}
                  </button>
                  <input
                    ref={el => { inputRefs.current[i] = el }}
                    value={l.text}
                    onChange={e => setLineText(l.id, e.target.value)}
                    onKeyDown={e => handleLineKey(e, i)}
                    placeholder={i === 0 ? 'Escribe y Enter para otra línea...' : ''}
                    className={`flex-1 bg-transparent border-none outline-none text-sm leading-6 text-zinc-700 dark:text-zinc-200 placeholder-zinc-300 dark:placeholder-zinc-600 min-w-0 ${l.completed ? 'line-through text-zinc-400' : ''}`}
                  />
                </div>
              ))}
            </div>
          )}

          {kind === 'task' && mode === 'text' && (
            <textarea
              ref={paperRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Escribe el detalle de la tarea..."
              className="flex-1 min-h-[45vh] bg-transparent border-none outline-none resize-none text-sm leading-7 text-zinc-600 dark:text-zinc-300 placeholder-zinc-300 dark:placeholder-zinc-600 w-full"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-3 px-1 shrink-0">
          <p className="text-[10px] text-zinc-400">
            {kind === 'task' && mode === 'check' && filledCount > 0 && `${doneCount}/${filledCount} listas`}
            {kind === 'task' && mode === 'check' && filledCount === 0 && 'Enter crea otra línea'}
            {kind === 'note' && 'Se guarda como nota enlazada al día'}
            {kind === 'task' && mode === 'text' && 'Sin casillas, solo texto'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-4 py-1.5 rounded-lg bg-zinc-800 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-white transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
