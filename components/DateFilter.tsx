'use client'

import { CalendarIcon, XMarkIcon } from './Icons'

interface Props {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function DateFilter({ value, onChange, className = '' }: Props) {
  const active = value.length > 0
  return (
    <div className={`relative flex items-center gap-1.5 pl-2.5 py-1.5 rounded-lg transition-colors ${
      active
        ? 'bg-[#7C9DD2]/15 text-[#5A7CB0] dark:bg-[#7C9DD2]/25 dark:text-[#A8C0E4]'
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
    } ${className}`}>
      <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        title="Filtrar por fecha"
        className={`text-xs bg-transparent focus:outline-none min-w-0 ${
          active ? 'pr-5 text-[#5A7CB0] dark:text-[#A8C0E4]' : 'pr-1 text-zinc-600 dark:text-zinc-300'
        }`}
      />
      {active && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Quitar filtro"
          className="absolute right-1 flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}