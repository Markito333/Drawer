'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Note, Task } from '@/lib/types'
import { getNotes, getTasks, createNote, createTask } from '@/lib/storage'
import { toDateKey, formatDateKey } from '@/lib/dates'
import { BackArrowIcon, NoteIcon, TaskIcon, PhotoIcon, CheckCircleIcon, CircleIcon, EyeIcon, XMarkIcon } from './Icons'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const PALETTE = [
  { bg: 'bg-red-200 dark:bg-red-950/60', border: 'border-red-500 dark:border-red-600', text: 'text-red-600 dark:text-red-400' },
  { bg: 'bg-orange-200 dark:bg-orange-950/60', border: 'border-orange-500 dark:border-orange-600', text: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-amber-200 dark:bg-amber-950/60', border: 'border-amber-500 dark:border-amber-600', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-yellow-200 dark:bg-yellow-950/60', border: 'border-yellow-500 dark:border-yellow-600', text: 'text-yellow-700 dark:text-yellow-500' },
  { bg: 'bg-lime-200 dark:bg-lime-950/60', border: 'border-lime-500 dark:border-lime-600', text: 'text-lime-700 dark:text-lime-500' },
  { bg: 'bg-green-200 dark:bg-green-950/60', border: 'border-green-500 dark:border-green-600', text: 'text-green-600 dark:text-green-400' },
  { bg: 'bg-teal-200 dark:bg-teal-950/60', border: 'border-teal-500 dark:border-teal-600', text: 'text-teal-600 dark:text-teal-400' },
  { bg: 'bg-sky-200 dark:bg-sky-950/60', border: 'border-sky-500 dark:border-sky-600', text: 'text-sky-600 dark:text-sky-400' },
  { bg: 'bg-blue-200 dark:bg-blue-950/60', border: 'border-blue-500 dark:border-blue-600', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-indigo-200 dark:bg-indigo-950/60', border: 'border-indigo-500 dark:border-indigo-600', text: 'text-indigo-600 dark:text-indigo-400' },
  { bg: 'bg-purple-200 dark:bg-purple-950/60', border: 'border-purple-500 dark:border-purple-600', text: 'text-purple-600 dark:text-purple-400' },
  { bg: 'bg-pink-200 dark:bg-pink-950/60', border: 'border-pink-500 dark:border-pink-600', text: 'text-pink-600 dark:text-pink-400' },
]

function groupByDate<T>(items: T[], getTime: (item: T) => number | null | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const t = getTime(item)
    if (!t) continue
    const key = toDateKey(t)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return map
}

function keyToNoon(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).getTime()
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function DayModal({ open, onClose }: Props) {
  const router = useRouter()
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const imageDayRef = useRef('')

  const { tasksByDate, notesByDate } = useMemo(() => {
    if (!open) return { tasksByDate: new Map<string, Task[]>(), notesByDate: new Map<string, Note[]>() }
    return {
      tasksByDate: groupByDate(getTasks(), t => t.dueDate),
      notesByDate: groupByDate(getNotes(), n => n.updatedAt),
    }
  }, [open])

  const today = new Date()
  const todayKey = toDateKey(today.getTime())

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))
  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))

  const close = () => {
    setActiveKey(null)
    setExpanded(new Set())
    onClose()
  }

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const createNoteForDay = (key: string, images: string[] = []) => {
    const ts = keyToNoon(key)
    const id = crypto.randomUUID()
    createNote({
      id,
      title: images.length > 0 ? 'Imagen' : 'Nueva nota',
      content: '',
      images,
      imageCaptions: {},
      folderId: null,
      createdAt: ts,
      updatedAt: ts,
    })
    close()
    router.push(`/notes/${id}`)
  }

  const createTaskForDay = (key: string) => {
    const id = crypto.randomUUID()
    createTask({
      id,
      title: 'Nueva tarea',
      description: '',
      completed: false,
      status: 'new',
      subtasks: [],
      images: [],
      imageCaptions: {},
      dueDate: keyToNoon(key),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    close()
    router.push('/tasks')
  }

  const pickImage = (key: string) => {
    imageDayRef.current = key
    fileRef.current?.click()
  }

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const key = imageDayRef.current
    if (!file || !key) return
    const reader = new FileReader()
    reader.onload = () => createNoteForDay(key, [String(reader.result)])
    reader.readAsDataURL(file)
  }

  if (!open) return null

  const activeNotes = activeKey ? notesByDate.get(activeKey) || [] : []
  const activeTasks = activeKey ? tasksByDate.get(activeKey) || [] : []
  const headerDate = activeKey ? new Date(keyToNoon(activeKey)) : today

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40 p-4" onClick={close}>
      <div
        className="bg-zinc-100 dark:bg-zinc-800/95 rounded-2xl shadow-xl w-full max-w-xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 leading-none tracking-tight shrink-0">
            {headerDate.getDate()} {MONTHS[headerDate.getMonth()]}
          </p>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">Ver día</h2>
            <p className="text-[10px] text-zinc-400 leading-tight">Toca un día para ver y crear</p>
          </div>
          <button onClick={close} className="ml-auto text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-3 px-1">
          <button onClick={prevMonth} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <BackArrowIcon className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{MONTHS[month]} {year}</span>
            <button onClick={goToday} className="text-[10px] px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              Hoy
            </button>
          </div>
          <button onClick={nextMonth} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rotate-180">
            <BackArrowIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="text-[10px] text-zinc-400 font-medium text-center py-1">{wd}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 pb-16">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const key = toDateKey(new Date(year, month, day).getTime())
            const notes = notesByDate.get(key) || []
            const tasks = tasksByDate.get(key) || []
            const isActive = activeKey === key
            const isToday = key === todayKey
            const col = (firstDayOfWeek + i) % 7
            const popAlign = col <= 1 ? 'left-0' : col >= 5 ? 'right-0' : 'left-1/2 -translate-x-1/2'
            const preview = [
              ...notes.map(n => ({ key: `n${n.id}`, label: n.title || 'Sin título', kind: 'note' as const })),
              ...tasks.map(t => ({ key: `t${t.id}`, label: t.title, kind: 'task' as const })),
            ]

            const pastel = PALETTE[day % PALETTE.length]
            const hasContent = notes.length > 0 || tasks.length > 0
            const dayBg = isToday || hasContent ? pastel.bg : ''
            const dayText = isToday
              ? 'text-zinc-800 dark:text-zinc-100 font-bold'
              : hasContent
              ? 'text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-600 dark:text-zinc-300'

            return (
              <div key={key} className="relative">
                <div className="h-3 mb-0.5 flex items-start justify-center">
                  {isToday && <p className={`text-[9px] font-bold leading-none ${pastel.text}`}>Hoy</p>}
                </div>
                <button
                  onClick={() => { setExpanded(new Set()); setActiveKey(prev => prev === key ? null : key) }}
                  className={`w-full min-h-[4rem] rounded-xl px-1 py-1.5 flex flex-col transition-colors border-2 ${
                    isToday ? pastel.border : 'border-transparent'
                  } ${dayBg || 'bg-white dark:bg-zinc-900/60 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/50'} ${
                    isActive ? 'ring-2 ring-zinc-400 dark:ring-zinc-500' : ''
                  }`}
                >
                  <div className="flex-1 space-y-0.5 overflow-hidden pointer-events-none">
                    {preview.slice(0, 2).map(it => (
                      <p key={it.key} className="flex items-center gap-0.5 text-[8px] leading-tight">
                        <span className={`w-1 h-1 rounded-full shrink-0 ring-1 ring-white/80 dark:ring-zinc-900/60 ${it.kind === 'note' ? 'bg-[#5B8DD9]' : 'bg-[#D9649A]'}`} />
                        <span className="truncate text-zinc-600 dark:text-zinc-300">{it.label}</span>
                      </p>
                    ))}
                    {preview.length > 2 && (
                      <p className="text-[8px] leading-tight pl-1.5 text-zinc-500 dark:text-zinc-400">
                        +{preview.length - 2}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs text-center mt-auto ${dayText}`}>
                    {day}
                  </span>
                </button>

                {isActive && (
                  <div className={`absolute ${popAlign} top-full mt-1 z-50 flex items-center gap-0.5 p-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg`}>
                    <button
                      onClick={() => createNoteForDay(key)}
                      title="Crear nota"
                      className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <NoteIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => createTaskForDay(key)}
                      title="Crear tarea"
                      className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <TaskIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => pickImage(key)}
                      title="Añadir imagen"
                      className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <PhotoIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {activeKey && (
          <div className="mt-2 pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 capitalize mb-2">
              {formatDateKey(activeKey)}
            </p>
            {activeNotes.length === 0 && activeTasks.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2">Sin nada para este día</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {activeNotes.map(note => {
                  const isOpen = expanded.has(`n${note.id}`)
                  const plain = note.content.replace(/<[^>]+>/g, '').trim()
                  return (
                    <div key={note.id} className="rounded-lg bg-[#9EC5F5]/25 dark:bg-[#4E6B92]/20 overflow-hidden">
                      <div className="flex items-center gap-2 p-2">
                        <NoteIcon className="w-3.5 h-3.5 text-[#5B8DD9] shrink-0" />
                        <Link href={`/notes/${note.id}`} onClick={close} className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-800 dark:text-zinc-100 truncate">{note.title || 'Sin título'}</p>
                        </Link>
                        {note.images.length > 0 && (
                          <span className="text-[9px] text-zinc-400 shrink-0">{note.images.length} img</span>
                        )}
                        <button
                          onClick={() => toggleExpanded(`n${note.id}`)}
                          title="Ver contenido"
                          className={`p-1 rounded-md transition-colors shrink-0 ${isOpen ? 'bg-[#5B8DD9]/25 text-[#5B8DD9]' : 'text-zinc-400 hover:bg-[#9EC5F5]/40 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="px-2 pb-2 pl-7">
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-snug whitespace-pre-wrap break-words">
                            {plain || 'Sin contenido'}
                          </p>
                          {note.images.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {note.images.slice(0, 4).map(img => (
                                <img key={img} src={img} alt="" className="w-10 h-10 rounded object-cover" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {activeTasks.map(task => {
                  const isOpen = expanded.has(`t${task.id}`)
                  const desc = task.description.replace(/<[^>]+>/g, '').trim()
                  return (
                    <div key={task.id} className="rounded-lg bg-[#F5B8D0]/25 dark:bg-[#96627C]/20 overflow-hidden">
                      <div className="flex items-center gap-2 p-2">
                        {task.completed
                          ? <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          : <CircleIcon className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />}
                        <Link href="/tasks" onClick={close} className="flex-1 min-w-0">
                          <p className={`text-xs truncate ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}>{task.title}</p>
                        </Link>
                        {task.subtasks.length > 0 && (
                          <span className="text-[9px] text-zinc-400 shrink-0">
                            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                          </span>
                        )}
                        <button
                          onClick={() => toggleExpanded(`t${task.id}`)}
                          title="Ver contenido"
                          className={`p-1 rounded-md transition-colors shrink-0 ${isOpen ? 'bg-[#D9649A]/25 text-[#D9649A]' : 'text-zinc-400 hover:bg-[#F5B8D0]/40 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="px-2 pb-2 pl-7 space-y-1.5">
                          {desc && (
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-snug whitespace-pre-wrap break-words">{desc}</p>
                          )}
                          {task.subtasks.length > 0 && (
                            <div className="space-y-0.5">
                              {task.subtasks.map(s => (
                                <p key={s.id} className="flex items-start gap-1.5 text-[11px]">
                                  <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${s.completed ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                                  <span className={s.completed ? 'line-through text-zinc-400' : 'text-zinc-600 dark:text-zinc-300'}>{s.text}</span>
                                </p>
                              ))}
                            </div>
                          )}
                          {task.images.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.images.slice(0, 4).map(img => (
                                <img key={img} src={img} alt="" className="w-10 h-10 rounded object-cover" />
                              ))}
                            </div>
                          )}
                          {!desc && task.subtasks.length === 0 && task.images.length === 0 && (
                            <p className="text-[11px] text-zinc-400">Sin contenido</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChosen} className="hidden" />
      </div>
    </div>
  )
}
