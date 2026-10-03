'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Note, Task } from '@/lib/types'
import { getNotes, getTasks } from '@/lib/storage'
import { toDateKey, formatDateKey } from '@/lib/dates'
import DateFilter from './DateFilter'
import { XMarkIcon, CheckCircleIcon, CircleIcon, BackArrowIcon } from './Icons'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const NOTE_COLOR = 'bg-[#9EC5F5] dark:bg-[#4E6B92] text-zinc-900 dark:text-zinc-50'
const TASK_COLOR = 'bg-[#F5B8D0] dark:bg-[#96627C] text-zinc-900 dark:text-zinc-50'
const BOTH_COLOR = 'bg-[#D5C4EE] dark:bg-[#6E5F92] text-zinc-900 dark:text-zinc-50'

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

export default function Calendar() {
  const [today] = useState(() => new Date())
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [filter, setFilter] = useState<string>('')

  const tasksByDate = useMemo(() => groupByDate(getTasks(), t => t.dueDate), [])
  const notesByDate = useMemo(() => groupByDate(getNotes(), n => n.updatedAt), [])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const todayKey = toDateKey(today.getTime())

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))

  const days: { day: number; key: string; tasks: Task[]; notes: Note[]; color: string }[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(new Date(year, month, d).getTime())
    const dayTasks = tasksByDate.get(key) || []
    const dayNotes = notesByDate.get(key) || []
    const color = dayTasks.length > 0 && dayNotes.length > 0
      ? BOTH_COLOR
      : dayNotes.length > 0
      ? NOTE_COLOR
      : dayTasks.length > 0
      ? TASK_COLOR
      : ''
    days.push({ day: d, key, tasks: dayTasks, notes: dayNotes, color })
  }

  const selectedTasks = filter ? tasksByDate.get(filter) || [] : []
  const selectedNotes = filter ? notesByDate.get(filter) || [] : []

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0">
            <BackArrowIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rotate-180 shrink-0">
            <BackArrowIcon className="w-4 h-4" />
          </button>
        </div>

        <DateFilter value={filter} onChange={setFilter} className="w-full" />

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="text-[10px] text-zinc-400 font-medium py-1">{wd}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(d => (
            <button
              key={d.key}
              onClick={() => setFilter(prev => prev === d.key ? '' : d.key)}
              title={d.color ? `${d.notes.length} notas · ${d.tasks.length} tareas` : undefined}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg text-xs transition-all ${
                d.color || 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              } ${d.key === todayKey ? 'ring-2 ring-zinc-400 dark:ring-zinc-500 font-bold' : ''} ${
                filter === d.key ? 'ring-2 ring-[#7C9DD2] font-bold' : ''
              }`}
            >
              {d.day}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#9EC5F5] dark:bg-[#4E6B92]" />
            Notas
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F5B8D0] dark:bg-[#96627C]" />
            Tareas
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#D5C4EE] dark:bg-[#6E5F92]" />
            Ambas
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm ring-2 ring-zinc-400 dark:ring-zinc-500" />
            Hoy
          </span>
        </div>
      </div>

      <div className="flex-1 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 p-5 border border-zinc-200/50 dark:border-zinc-800/50 min-h-[200px]">
        {filter ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 capitalize">
                {formatDateKey(filter)}
              </p>
              <button onClick={() => setFilter('')} title="Quitar filtro" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {selectedNotes.length === 0 && selectedTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">Sin nada para este día</p>
            ) : (
              <div className="space-y-4">
                {selectedNotes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-2">
                      Notas ({selectedNotes.length})
                    </p>
                    <div className="space-y-2">
                      {selectedNotes.map(note => (
                        <Link
                          key={note.id}
                          href={`/notes/${note.id}`}
                          className="block p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-[#9EC5F5]/25 dark:bg-[#4E6B92]/20 hover:bg-[#9EC5F5]/40 dark:hover:bg-[#4E6B92]/30 transition-colors"
                        >
                          <p className="text-sm text-zinc-800 dark:text-zinc-100">
                            {note.title || 'Sin título'}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                            {note.content ? note.content.replace(/<[^>]+>/g, '').substring(0, 120) : 'Sin contenido'}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-2">
                      Tareas ({selectedTasks.length})
                    </p>
                    <div className="space-y-2">
                      {selectedTasks.map(task => (
                        <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-[#F5B8D0]/25 dark:bg-[#96627C]/20">
                          {task.completed ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <CircleIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                              {task.title}
                            </p>
                            {task.subtasks.length > 0 && (
                              <p className="text-[10px] text-zinc-400 mt-0.5">
                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtareas
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-400 py-8 text-center">Selecciona un día para ver su contenido</p>
        )}
      </div>
    </div>
  )
}