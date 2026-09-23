'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getNotes, getTasks } from '@/lib/storage'
import { BellIcon, XMarkIcon, EyeIcon, CheckIcon } from './Icons'

const CHANNEL_CACHE_KEY = 'organizer-notif-channel-cache'
const SEEN_KEY = 'organizer-notif-seen'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const CACHE_TTL = 15 * 60 * 1000

interface ChannelVideo {
  id: string
  title: string
  url: string
  thumbnail: string
  published: string
}

interface ChannelCacheEntry {
  fetchedAt: number
  avatar: string
  videos: ChannelVideo[]
}

type NotifItem =
  | { kind: 'video'; id: string; title: string; url: string; thumbnail: string; channelName: string; dateLabel: string }
  | { kind: 'task'; id: string; title: string; dateLabel: string }

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function videoDateLabel(published: string): string {
  const t = new Date(published).getTime()
  if (isNaN(t)) return ''
  const diffDays = Math.round((startOfToday() - t) / DAY_MS)
  if (diffDays <= 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  return new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function taskDateLabel(dueDate: number): string {
  const diffDays = Math.round((dueDate - startOfToday()) / DAY_MS)
  if (diffDays <= 0) return 'Hoy'
  if (diffDays === 1) return 'Mañana'
  return `en ${diffDays} días`
}

async function fetchChannelData(ch: { id: string; name?: string }) {
  const url = ch.id.startsWith('http') ? ch.id : `https://www.youtube.com/channel/${ch.id}`
  let cache: Record<string, ChannelCacheEntry> = {}
  try {
    cache = JSON.parse(localStorage.getItem(CHANNEL_CACHE_KEY) || '{}')
  } catch { /* ignore */ }
  const cached = cache[url]
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached
  try {
    const res = await fetch(`/api/youtube/channel?url=${encodeURIComponent(url)}`)
    const data = await res.json()
    const entry: ChannelCacheEntry = {
      fetchedAt: Date.now(),
      avatar: data.avatar || '',
      videos: data.videos || [],
    }
    cache[url] = entry
    try { localStorage.setItem(CHANNEL_CACHE_KEY, JSON.stringify(cache)) } catch { /* ignore */ }
    return entry
  } catch {
    return cached || { fetchedAt: 0, avatar: '', videos: [] }
  }
}

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveSeen(seen: Set<string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])) } catch { /* ignore */ }
}

export default function NotificationBell({ dark = false }: { dark?: boolean }) {
  const router = useRouter()
  const [items, setItems] = useState<NotifItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    return loadSeen()
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showRead, setShowRead] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = () => {
    if (typeof window === 'undefined') return
    const channels = getNotes()
      .flatMap(n => n.channels || (n.channelId ? [{ id: n.channelId, name: n.channelName }] : []))
      .filter((ch, i, arr) => arr.findIndex(c => c.id === ch.id) === i)

    const videos: NotifItem[] = []
    const now = Date.now()
    Promise.all(channels.map(async ch => {
      const data = await fetchChannelData(ch)
      for (const v of data.videos) {
        const t = new Date(v.published).getTime()
        if (isNaN(t) || now - t > WEEK_MS) continue
        videos.push({
          kind: 'video',
          id: `video:${v.id}`,
          title: v.title,
          url: v.url,
          thumbnail: v.thumbnail,
          channelName: ch.name || ch.id,
          dateLabel: videoDateLabel(v.published),
        })
      }
    })).catch(() => {/* ignore */}).finally(() => {
      const todayStart = startOfToday()
      const taskItems: NotifItem[] = getTasks()
        .filter(t => t.dueDate && !t.completed && t.dueDate >= todayStart && t.dueDate <= todayStart + WEEK_MS)
        .map(t => ({
          kind: 'task' as const,
          id: `task:${t.id}`,
          title: t.title,
          dateLabel: taskDateLabel(t.dueDate!),
        }))
      setItems([...videos, ...taskItems])
      setLoading(false)
    })
  }

  const handleOutsideClick = (e: MouseEvent) => {
    if (btnRef.current?.contains(e.target as Node)) return
    if (panelRef.current?.contains(e.target as Node)) return
    setOpen(false)
  }

  useEffect(() => {
    load()
    const onData = () => load()
    window.addEventListener('organizer-data-changed', onData)
    return () => window.removeEventListener('organizer-data-changed', onData)
  }, [])

  useEffect(() => {
    if (!open) return
    document.addEventListener('mousedown', handleOutsideClick)
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open])

  const unread = items.filter(i => !seen.has(i.id))
  const badgeCount = unread.length
  const readCount = seen.size
  const visibleItems = showRead ? items.filter(i => seen.has(i.id)) : unread

  const toggle = () => {
    if (!open) {
      const r = btnRef.current?.getBoundingClientRect()
      if (r) {
        const panelW = 320
        const left = Math.max(8, Math.min(r.left, (window.innerWidth || 0) - panelW - 8))
        setPos({ top: r.bottom + 8, left })
      }
      load()
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const markAllRead = () => {
    const next = new Set(seen)
    items.forEach(i => next.add(i.id))
    setSeen(next)
    saveSeen(next)
  }

  const markOneRead = (id: string) => {
    const next = new Set(seen)
    next.add(id)
    setSeen(next)
    saveSeen(next)
    setSelectedId(null)
  }

  const openVideo = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    setSelectedId(null)
  }

  const openCalendar = () => {
    setOpen(false)
    setSelectedId(null)
    router.push('/calendar')
  }

  const actionClasses = (forceVisible: boolean) =>
    `flex items-center gap-1 shrink-0 transition-opacity ${
      forceVisible
        ? 'opacity-100'
        : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
    }`

  const videoItems = visibleItems.filter(i => i.kind === 'video') as Extract<NotifItem, { kind: 'video' }>[]
  const taskItems = visibleItems.filter(i => i.kind === 'task') as Extract<NotifItem, { kind: 'task' }>[]

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-colors shrink-0 ${
          dark
            ? 'bg-white/15 border-white/20 text-white hover:bg-white/25'
            : 'bg-white/80 border-zinc-200 text-zinc-500 hover:text-zinc-700 dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
        title="Notificaciones"
      >
        <BellIcon className="w-4.5 h-4.5" />
        {badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {open && pos && (
        <div
          ref={panelRef}
          className="fixed z-[100] w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 shrink-0">Notificaciones</p>
              <div className="flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setShowRead(false)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                    !showRead
                      ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Nuevas
                  <span className={`rounded-full px-1.5 text-[10px] font-semibold ${
                    !showRead ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}>
                    {badgeCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRead(true)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                    showRead
                      ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Leídas
                  <span className={`rounded-full px-1.5 text-[10px] font-semibold ${
                    showRead ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}>
                    {readCount}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {badgeCount > 0 && !showRead && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  Marcar leídas
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-transparent animate-spin" />
              </div>
            ) : visibleItems.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">
                {showRead ? 'Sin notificaciones leídas' : 'Sin notificaciones'}
              </p>
            ) : (
              <>
                {videoItems.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide px-2 pt-1 pb-1.5">
                      Videos nuevos
                    </p>
                    <div className="space-y-1">
                      {videoItems.map(v => (
                        <div
                          key={v.id}
                          className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                            seen.has(v.id) ? 'opacity-50' : ''
                          } hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer`}
                          onClick={() => setSelectedId(prev => prev === v.id ? null : v.id)}
                        >
                          <img src={v.thumbnail} alt="" className="w-14 h-9 rounded-md object-cover shrink-0" loading="lazy" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug">{v.title}</span>
                            <span className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-zinc-400 truncate">{v.channelName}</span>
                              <span className="text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0">{v.dateLabel}</span>
                            </span>
                          </span>
                          <span className={actionClasses(selectedId === v.id)}>
                            <button
                              onClick={e => { e.stopPropagation(); openVideo(v.url) }}
                              title="Ver"
                              className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); markOneRead(v.id) }}
                              title="Marcar como leída"
                              className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                              <CheckIcon className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {taskItems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide px-2 pt-1 pb-1.5">
                      Tareas y eventos
                    </p>
                    <div className="space-y-1">
                      {taskItems.map(t => (
                        <div
                          key={t.id}
                          className={`group flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors ${
                            seen.has(t.id) ? 'opacity-50' : ''
                          } hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer`}
                          onClick={() => setSelectedId(prev => prev === t.id ? null : t.id)}
                        >
                          <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold">{t.dateLabel === 'Hoy' ? 'H' : ''}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug">{t.title}</span>
                            <span className="block text-[10px] text-zinc-400 mt-0.5">{t.dateLabel}</span>
                          </span>
                          <span className={actionClasses(selectedId === t.id)}>
                            <button
                              onClick={e => { e.stopPropagation(); openCalendar() }}
                              title="Ver"
                              className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); markOneRead(t.id) }}
                              title="Marcar como leída"
                              className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                              <CheckIcon className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}