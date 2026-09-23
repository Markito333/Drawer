'use client'

import Link from 'next/link'
import { BackArrowIcon } from '@/components/Icons'
import Calendar from '@/components/Calendar'
import NotificationBell from '@/components/NotificationBell'

export default function CalendarPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="relative flex items-center justify-center min-h-[48px]">
        <div className="absolute left-0 flex items-center gap-2">
          <NotificationBell />
          <Link href="/" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <BackArrowIcon className="w-4 h-4" />
            Inicio
          </Link>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Calendario</h2>
          <p className="text-sm text-zinc-400">Tareas agendadas por día</p>
        </div>
      </div>
      <Calendar />
    </div>
  )
}
