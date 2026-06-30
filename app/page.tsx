'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Note, Task, MindMap, Contact } from '@/lib/types'
import { getNotes, getTasks, getMindMaps, getContacts } from '@/lib/storage'
import { getAllDataAsJSON } from '@/lib/links'
import { FlatNoteIcon, FlatTaskIcon, FlatMindMapIcon, FlatCalendarIcon, FlatContactIcon, NoteIcon, TaskIcon, MindMapIcon, CheckIcon, SaveIcon, XMarkIcon, TechIcon } from '@/components/Icons'
import SearchBar from '@/components/SearchBar'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [mindMaps, setMindMaps] = useState<MindMap[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [showExport, setShowExport] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [featureIndex, setFeatureIndex] = useState(0)

  const features = [
    { text: 'Notas enriquecidas con formato y enlaces', icon: 'N' },
    { text: 'Detección automática de contactos desde teléfonos', icon: 'C' },
    { text: 'Gestión de tareas con subtareas y fechas', icon: 'T' },
    { text: 'Mapas mentales interactivos', icon: 'M' },
    { text: 'Exportación de datos a JSON', icon: 'E' },
    { text: 'Calendario con vista de tareas próximas', icon: 'D' },
    { text: 'Insertar imágenes con pies de foto', icon: 'I' },
    { text: 'Carpetas para organizar proyectos', icon: 'P' },
    { text: 'Selector de tecnologías para proyectos', icon: 'S' },
    { text: 'Búsqueda global en notas y tareas', icon: 'B' },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureIndex(prev => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setNotes(getNotes().slice(0, 2))
    setTasks(getTasks().slice(0, 5))
    setMindMaps(getMindMaps().slice(0, 3))
    setContacts(getContacts())
  }, [])

  const pendingTasks = tasks.filter(t => !t.completed).length
  const upcomingTasks = tasks.filter(t => t.dueDate && !t.completed).sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0)).slice(0, 3)

  const q = search.toLowerCase().trim()
  const allNotes = getNotes()
  const allTasks = getTasks()
  const searchResults = q ? {
    notes: allNotes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)),
    tasks: allTasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
  } : null

  return (
    <div className="flex gap-4 p-6 max-w-7xl mx-auto min-h-screen">
      <div className="hidden md:flex flex-col w-64 shrink-0 rounded-2xl overflow-hidden relative bg-zinc-800 h-[calc(100vh-3rem)] sticky top-6">
        <div className="absolute inset-0">
          <img src="/side2.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 flex items-center gap-2 p-4">
          <button onClick={() => setShowExport(true)} className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/30 backdrop-blur-sm text-white hover:bg-white/40 transition-colors shrink-0 shadow-sm" title="Guardar datos">
            <SaveIcon className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar..." inputClassName="bg-white/30 backdrop-blur-sm text-white placeholder-white/50 focus:ring-white/30" />
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6">
        </div>
        <div className="relative z-10 px-4 pb-5">
          <button
            onClick={() => setShowFeatures(true)}
            className="w-full text-sm font-medium py-2 rounded-xl bg-white/90 backdrop-blur-sm text-zinc-800 hover:bg-white shadow-sm transition-all"
          >
            Saber más
          </button>
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-4">
      <div className="flex-1 space-y-4">
 
      {searchResults ? (
        <div className="space-y-4">
          {searchResults.notes.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Notas ({searchResults.notes.length})</h2>
              <div className="space-y-1">
                {searchResults.notes.map(note => (
                  <Link key={note.id} href={`/notes/${note.id}`} className="block text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    {note.title || 'Sin título'}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {searchResults.tasks.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Tareas ({searchResults.tasks.length})</h2>
              <div className="space-y-1">
                {searchResults.tasks.map(task => (
                  <Link key={task.id} href="/tasks" className="block text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    {task.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {searchResults.notes.length === 0 && searchResults.tasks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-zinc-400">No se encontraron resultados</p>
            </div>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-3 flex items-center gap-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 p-4">
          <div className="flex items-center gap-1.5">
            <Link href="/notes" className="flex flex-col items-center gap-1 py-2 px-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/40 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700/60 transition-colors shadow-sm">
                <FlatNoteIcon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-medium text-zinc-800 dark:text-zinc-100 leading-tight">Notas</p>
              <p className="text-[9px] text-zinc-400 -mt-0.5 leading-tight">{notes.length} notas</p>
            </Link>
            <Link href="/tasks" className="flex flex-col items-center gap-1 py-2 px-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/40 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700/60 transition-colors shadow-sm">
                <FlatTaskIcon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-medium text-zinc-800 dark:text-zinc-100 leading-tight">Tareas</p>
              <p className="text-[9px] text-zinc-400 -mt-0.5 leading-tight">{pendingTasks} pendientes</p>
            </Link>
            <Link href="/mindmaps" className="flex flex-col items-center gap-1 py-2 px-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/40 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700/60 transition-colors shadow-sm">
                <FlatMindMapIcon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-medium text-zinc-800 dark:text-zinc-100 leading-tight">Mapas</p>
              <p className="text-[9px] text-zinc-400 -mt-0.5 leading-tight">{mindMaps.length} mapas</p>
            </Link>
            <Link href="/calendar" className="flex flex-col items-center gap-1 py-2 px-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/40 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700/60 transition-colors shadow-sm">
                <FlatCalendarIcon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-medium text-zinc-800 dark:text-zinc-100 leading-tight">Calendario</p>
              <p className="text-[9px] text-zinc-400 -mt-0.5 leading-tight">{upcomingTasks.length} próximas</p>
            </Link>
            <Link href="/contacts" className="flex flex-col items-center gap-1 py-2 px-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/40 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700/60 transition-colors shadow-sm">
                <FlatContactIcon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-medium text-zinc-800 dark:text-zinc-100 leading-tight">Contactos</p>
              <p className="text-[9px] text-zinc-400 -mt-0.5 leading-tight">{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</p>
            </Link>
          </div>
          <div className="flex-1 h-full min-h-[5rem] rounded-xl bg-zinc-100/50 dark:bg-zinc-800/30 flex items-center justify-center gap-4 px-4 py-2">
            {(() => {
              const chartData = [
                { value: notes.length, color: '#FFB5A7', label: 'Notas' },
                { value: tasks.length, color: '#FCD5CE', label: 'Tareas' },
                { value: mindMaps.length, color: '#FFD6BA', label: 'Mapas' },
                { value: upcomingTasks.length, color: '#FCE4B8', label: 'Calendario' },
                { value: contacts.length, color: '#FFF1C1', label: 'Contactos' },
              ]
              const total = chartData.reduce((s, d) => s + d.value, 0)
              if (total === 0) return <span className="text-[10px] text-zinc-300 dark:text-zinc-600">Sin datos</span>
              const size = 100, sw = 12, r = (size - sw) / 2, c = Math.PI * 2 * r, gap = 1.5
              let cum = 0
              return (
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xl italic font-medium text-zinc-800 dark:text-zinc-100 leading-tight">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
                    {chartData.map(d => {
                      const pct = d.value / total
                      const segLen = (pct * 100 - gap) / 100 * c
                      const offset = -(cum / 100 * c)
                      cum += pct * 100
                      return (
                        <circle key={d.label} cx={size/2} cy={size/2} r={r} fill="none" stroke={d.color} strokeWidth={sw}
                          strokeDasharray={`${Math.max(segLen, 0.5)} ${c - Math.max(segLen, 0.5)}`}
                          strokeDashoffset={offset} strokeLinecap="round"
                          transform={`rotate(-90 ${size/2} ${size/2})`} />
                      )
                    })}
                  </svg>
                  <div className="flex flex-col gap-1">
                    {chartData.map(d => (
                      <div key={d.label} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight">{d.label}</span>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-tight ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

      {notes.length > 0 && (
        <div className="col-span-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"><NoteIcon className="w-4 h-4 text-zinc-500" />Notas recientes</h2>
            <Link href="/notes" className="text-xs text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors">Ver todas</Link>
          </div>
          <div className="grid gap-3">
            {notes.map(note => (
              <Link key={note.id} href={`/notes/${note.id}`} className="block p-4 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 transition-colors">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug">{note.title || 'Sin título'}</p>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{note.content ? note.content.replace(/<[^>]+>/g, '').substring(0, 120) : 'Sin contenido'}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="col-span-1 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"><TaskIcon className="w-4 h-4 text-zinc-500" />Tareas</h2>
            <Link href="/tasks" className="text-xs text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors">Ver todas</Link>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 2).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60">
                <CheckIcon className={`w-4 h-4 shrink-0 ${task.completed ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                    {task.title}
                  </p>
                  {task.dueDate && !task.completed && (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
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

      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={() => setShowExport(false)}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Guardar datos</h3>
              <button onClick={() => setShowExport(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                ¿Quieres descargar una copia de seguridad de todos tus datos?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowExport(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const json = getAllDataAsJSON()
                    const blob = new Blob([json], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `organizer-backup-${new Date().toISOString().split('T')[0]}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                    setShowExport(false)
                  }}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-800 dark:hover:bg-zinc-300 transition-colors font-medium"
                >
                  Descargar JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFeatures && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40 p-4" onClick={() => setShowFeatures(false)}>
          <div
            className="bg-zinc-100 dark:bg-zinc-800/95 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Funcionalidades</h2>
              <button onClick={() => setShowFeatures(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><rect x="3" y="2" width="18" height="20" rx="2" fill="#60A5FA"/><rect x="7" y="8" width="10" height="2" rx="1" fill="#fff" opacity="0.9"/><rect x="7" y="12" width="10" height="2" rx="1" fill="#fff" opacity="0.7"/><rect x="7" y="16" width="6" height="2" rx="1" fill="#fff" opacity="0.5"/></svg>, title: 'Notas', desc: 'Texto enriquecido con formato, enlaces e imágenes' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" fill="#A78BFA"/><circle cx="12" cy="16" r="3" fill="#34D399"/><path d="M10.5 16l1 1 2-2" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>, title: 'Tareas', desc: 'Subtareas, fechas de vencimiento y seguimiento' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><circle cx="12" cy="5" r="3.5" fill="#34D399"/><circle cx="5" cy="18" r="3" fill="#60A5FA"/><circle cx="19" cy="18" r="3" fill="#FBBF24"/><path d="M12 8.5l-5 7" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/><path d="M12 8.5l5 7" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/></svg>, title: 'Mapas', desc: 'Mapas mentales interactivos para ideas' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="18" rx="2" fill="#FBBF24"/><rect x="2" y="10" width="20" height="3" fill="#F59E0B"/><rect x="2" y="4" width="20" height="3" rx="2" fill="#F59E0B"/></svg>, title: 'Calendario', desc: 'Vista mensual con tareas por día' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#F472B6"/><circle cx="12" cy="9" r="3.5" fill="#fff" opacity="0.9"/><ellipse cx="12" cy="17" rx="5.5" ry="3.5" fill="#fff" opacity="0.9"/></svg>, title: 'Contactos', desc: 'Detección automática desde números' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#F59E0B"/><rect x="4" y="7" width="16" height="2" fill="#FBBF24"/><rect x="4" y="11" width="16" height="2" fill="#FBBF24"/><rect x="4" y="15" width="10" height="2" fill="#FBBF24"/></svg>, title: 'Carpetas', desc: 'Organiza notas por proyectos' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#F87171"/><circle cx="12" cy="12" r="4" fill="#fff"/><path d="M11 11l2 2M13 11l-2 2" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: 'Imágenes', desc: 'Inserta imágenes con pies de foto' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><rect x="3" y="6" width="8" height="12" rx="1.5" fill="#A78BFA"/><rect x="13" y="6" width="8" height="12" rx="1.5" fill="#60A5FA"/><path d="M7 4v4M17 4v4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: 'Dibujo', desc: 'Pad de dibujo integrado para anotaciones' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><circle cx="10" cy="10" r="5" fill="#60A5FA"/><circle cx="17" cy="17" r="4" fill="#A78BFA"/><rect x="3" y="18" width="7" height="2" rx="1" fill="#FBBF24"/></svg>, title: 'Enlaces', desc: 'Detección y formateo automático de URLs' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" fill="#34D399"/><rect x="14" y="3" width="7" height="7" rx="1" fill="#60A5FA"/><rect x="3" y="14" width="7" height="7" rx="1" fill="#FBBF24"/><rect x="14" y="14" width="7" height="7" rx="1" fill="#F87171"/></svg>, title: 'Búsqueda', desc: 'Búsqueda global en notas y tareas' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M16 4l2 2-8 8-4-1 1-4 8-8z" fill="#F59E0B"/><path d="M4 20l4-1 1 1-4 4-1-4z" fill="#A78BFA"/></svg>, title: 'Tecnologías', desc: 'Iconos de tech stack para proyectos' },
                { icon: <svg className="w-6 h-6" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#34D399"/><path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>, title: 'Exportación', desc: 'Respaldo completo de datos en JSON' },
              ].map((feat, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-4 flex flex-col items-center gap-2 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{feat.title}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </div>

      <h2 className="text-center text-6xl font-black tracking-tight leading-none text-zinc-800 dark:text-zinc-100" style={{ fontFamily: 'var(--font-display)' }}>
Drawer</h2>

      <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-900/50 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">{features[featureIndex].icon}</span>
          </div>
          <div className="relative h-5 overflow-hidden">
            <p
              key={featureIndex}
              className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap animate-slide-up"
            >
              {features[featureIndex].text}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 ml-auto shrink-0">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => setFeatureIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === featureIndex ? 'bg-indigo-400 w-4' : 'bg-indigo-200 dark:bg-indigo-800'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}
