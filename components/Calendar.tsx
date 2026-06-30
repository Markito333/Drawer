'use client'

import { useState, useMemo } from 'react'
import type { Task } from '@/lib/types'
import { getTasks } from '@/lib/storage'
import { XMarkIcon, CheckCircleIcon, CircleIcon, BackArrowIcon } from './Icons'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    if (!t.dueDate) continue
    const key = new Date(t.dueDate).toISOString().split('T')[0]
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return map
}

export default function Calendar() {
  const [today] = useState(() => new Date())
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const tasks = getTasks()
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const todayKey = today.toISOString().split('T')[0]

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))

  function barColor(tasks: Task[]): string {
    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
    if (completed === total) return 'bg-green-400 dark:bg-green-500'
    if (total >= 4) return 'bg-rose-400 dark:bg-rose-500'
    if (total >= 2) return 'bg-amber-400 dark:bg-amber-500'
    return 'bg-sky-400 dark:bg-sky-500'
  }

  const days: { day: number; key: string; isToday: boolean; tasks: Task[]; color: string }[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const key = date.toISOString().split('T')[0]
    const dayTasks = tasksByDate.get(key) || []
    days.push({
      day: d,
      key,
      isToday: key === todayKey,
      tasks: dayTasks,
      color: dayTasks.length > 0 ? barColor(dayTasks) : '',
    })
  }

  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) || [] : []
  const selectedDateObj = selectedDate ? new Date(selectedDate) : null

  return (
    <div className="flex gap-6">
      <div className="w-80 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <BackArrowIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rotate-180">
            <BackArrowIcon className="w-4 h-4" />
          </button>
        </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map(wd => (
          <div key={wd} className="text-[10px] text-zinc-400 font-medium py-1">{wd}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(d => (
          <button
            key={d.day}
            onClick={() => setSelectedDate(d.key)}
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg text-xs transition-colors ${
              d.isToday
                ? 'bg-amber-300 text-zinc-900 dark:bg-amber-400 dark:text-zinc-900'
                : selectedDate === d.key
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {d.day}
            {d.tasks.length > 0 && (
              <span className={`mt-0.5 w-4 h-0.5 rounded-sm ${d.color}`} />
            )}
          </button>
        ))}
      </div>

      </div>

      <div className="flex-1 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 p-5 border border-zinc-200/50 dark:border-zinc-800/50 min-h-[200px]">
        {selectedDate && selectedDateObj ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {selectedDateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <button onClick={() => setSelectedDate(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {selectedTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">Sin tareas para este día</p>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
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
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-400 py-8 text-center">Selecciona un día para ver sus tareas</p>
        )}
      </div>
    </div>
  )
}
