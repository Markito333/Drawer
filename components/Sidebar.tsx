'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, NoteIcon, TaskIcon, MindMapIcon, CalendarIcon, ContactIcon } from './Icons'

const links = [
  { href: '/', label: 'Inicio', icon: HomeIcon },
  { href: '/calendar', label: 'Calendario', icon: CalendarIcon },
  { href: '/notes', label: 'Notas', icon: NoteIcon },
  { href: '/tasks', label: 'Tareas', icon: TaskIcon },
  { href: '/contacts', label: 'Contactos', icon: ContactIcon },
  { href: '/mindmaps', label: 'Mapas Mentales', icon: MindMapIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">
     
      <nav className="flex-1 p-3 space-y-1">
        {links.map(link => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 text-center">datos guardados localmente</p>
      </div>
    </aside>
  )
}
