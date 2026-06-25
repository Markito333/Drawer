'use client'

import { useEffect, useRef, useState } from 'react'
import { XMarkIcon } from '@/components/Icons'
import { getNotes, getTasks, getContacts } from '@/lib/storage'
import type { Note, Task, Contact } from '@/lib/types'

interface SearchItem {
  id: string
  label: string
  type: 'nota' | 'tarea' | 'contacto'
  color: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (title: string, nodeIds: string[]) => void
  initialTitle?: string
  initialNodeIds?: string[]
}

interface Node2D {
  x: number
  y: number
  vx: number
  vy: number
  item: SearchItem
}

export default function ConnectionsModal({ open, onClose, onSave, initialTitle, initialNodeIds }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SearchItem[]>([])
  const [title, setTitle] = useState('')
  const nodesRef = useRef<Node2D[]>([])
  const animRef = useRef(0)
  const timeRef = useRef(0)
  const draggingRef = useRef<{ idx: number; ox: number; oy: number } | null>(null)
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  const notes = getNotes()
  const tasks = getTasks()
  const contacts = getContacts()

  const q = search.toLowerCase().trim()
  const results: SearchItem[] = q ? [
    ...notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).map(n => ({ id: n.id, label: n.title || 'Sin título', type: 'nota' as const, color: '#60A5FA' })),
    ...tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)).map(t => ({ id: t.id, label: t.title, type: 'tarea' as const, color: '#A78BFA' })),
    ...contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).map(c => ({ id: c.id, label: c.name, type: 'contacto' as const, color: '#F472B6' })),
  ].slice(0, 20) : []

  const toggleItem = (item: SearchItem) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === item.id)
      if (exists) return prev.filter(s => s.id !== item.id)
      return [...prev, item]
    })
  }

  useEffect(() => {
    if (!open) return
    setSearch('')
    setTitle(initialTitle ?? '')
    if (initialNodeIds && initialNodeIds.length > 0) {
      const allNotes = getNotes()
      const allTasks = getTasks()
      const allContacts = getContacts()
      const items: SearchItem[] = []
      for (const id of initialNodeIds) {
        const n = allNotes.find(x => x.id === id)
        if (n) { items.push({ id: n.id, label: n.title || 'Sin título', type: 'nota', color: '#60A5FA' }); continue }
        const t = allTasks.find(x => x.id === id)
        if (t) { items.push({ id: t.id, label: t.title, type: 'tarea', color: '#A78BFA' }); continue }
        const c = allContacts.find(x => x.id === id)
        if (c) { items.push({ id: c.id, label: c.name, type: 'contacto', color: '#F472B6' }); continue }
      }
      setSelected(items)
    } else {
      setSelected([])
    }
  }, [open])

  useEffect(() => {
    if (!canvasRef.current || selected.length === 0) return
    const w = canvasRef.current.clientWidth
    const h = canvasRef.current.clientHeight
    const cx = w / 2 + panRef.current.x
    const cy = h / 2 + panRef.current.y
    const radius = Math.min(w, h) * 0.3
    nodesRef.current = selected.map((item, i) => {
      const angle = (i / selected.length) * Math.PI * 2 - Math.PI / 2
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        item,
      }
    })
  }, [selected])

  const getCanvasPos = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / zoomRef.current - panRef.current.x,
      y: (clientY - rect.top) / zoomRef.current - panRef.current.y,
    }
  }

  useEffect(() => {
    if (!open || !canvasRef.current || selected.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio, 2)
    let w = canvas.clientWidth
    let h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const getNodeAt = (x: number, y: number) => {
      const nodes = nodesRef.current
      for (let i = nodes.length - 1; i >= 0; i--) {
        const dx = x - nodes[i].x
        const dy = y - nodes[i].y
        if (dx * dx + dy * dy < 225) return i
      }
      return -1
    }

    const onPointerDown = (clientX: number, clientY: number) => {
      const pos = getCanvasPos(clientX, clientY)
      const idx = getNodeAt(pos.x, pos.y)
      if (idx >= 0) {
        draggingRef.current = { idx, ox: nodesRef.current[idx].x - pos.x, oy: nodesRef.current[idx].y - pos.y }
        canvas.style.cursor = 'grabbing'
      } else {
        isPanningRef.current = true
        panStartRef.current = { x: clientX - panRef.current.x, y: clientY - panRef.current.y }
        canvas.style.cursor = 'grabbing'
      }
    }

    const onPointerMove = (clientX: number, clientY: number) => {
      if (draggingRef.current) {
        const pos = getCanvasPos(clientX, clientY)
        const n = nodesRef.current[draggingRef.current.idx]
        n.x = pos.x + draggingRef.current.ox
        n.y = pos.y + draggingRef.current.oy
      } else if (isPanningRef.current) {
        panRef.current.x = clientX - panStartRef.current.x
        panRef.current.y = clientY - panStartRef.current.y
      } else {
        const pos = getCanvasPos(clientX, clientY)
        canvas.style.cursor = getNodeAt(pos.x, pos.y) >= 0 ? 'grab' : 'default'
      }
    }

    const onPointerUp = () => {
      draggingRef.current = null
      isPanningRef.current = false
      canvas.style.cursor = 'default'
    }

    const onMouseDown = (e: MouseEvent) => onPointerDown(e.clientX, e.clientY)
    const onMouseMove = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY)
    const onMouseUp = () => onPointerUp()
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; onPointerDown(t.clientX, t.clientY) }
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; onPointerMove(t.clientX, t.clientY) }
    const onTouchEnd = (e: TouchEvent) => { e.preventDefault(); onPointerUp() }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current * (e.deltaY > 0 ? 0.9 : 1.1)))
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    timeRef.current = 0
    const animate = () => {
      timeRef.current += 1
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(panRef.current.x, panRef.current.y)
      ctx.scale(zoomRef.current, zoomRef.current)

      const nodes = nodesRef.current
      if (nodes.length === 0) {
        ctx.restore()
        animRef.current = requestAnimationFrame(animate)
        return
      }

      const cx = w / 2 / zoomRef.current - panRef.current.x / zoomRef.current
      const cy = h / 2 / zoomRef.current - panRef.current.y / zoomRef.current

      // Force-directed layout (skip for dragged node)
      nodes.forEach((n, i) => {
        if (draggingRef.current && draggingRef.current.idx === i) return
        let fx = 0, fy = 0
        fx += (cx - n.x) * 0.008
        fy += (cy - n.y) * 0.008
        nodes.forEach(other => {
          if (other === n) return
          const dx = n.x - other.x
          const dy = n.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          fx += (dx / dist) * 60 / (dist * dist)
          fy += (dy / dist) * 60 / (dist * dist)
        })
        n.vx += fx
        n.vy += fy
        n.vx *= 0.88
        n.vy *= 0.88
        n.x += n.vx
        n.y += n.vy
      })

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const pulse = 0.15 + Math.sin(timeRef.current * 0.02 + i + j) * 0.1
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(nodes[j].x, nodes[j].y)
          ctx.strokeStyle = `rgba(124, 157, 210, ${pulse})`
          ctx.lineWidth = 1.5
          ctx.stroke()

          const t = ((timeRef.current * 0.005 + i / nodes.length) % 1)
          const px = nodes[i].x + dx * t
          const py = nodes[i].y + dy * t
          ctx.beginPath()
          ctx.arc(px, py, 2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(124, 157, 210, 0.8)'
          ctx.fill()
        }
      }

      // Nodes
      nodes.forEach(n => {
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 16)
        glow.addColorStop(0, n.item.color + '60')
        glow.addColorStop(1, n.item.color + '00')
        ctx.beginPath()
        ctx.arc(n.x, n.y, 16, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        ctx.beginPath()
        ctx.arc(n.x, n.y, 7, 0, Math.PI * 2)
        ctx.fillStyle = n.item.color
        ctx.fill()

        ctx.beginPath()
        ctx.arc(n.x - 1.5, n.y - 1.5, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fill()
      })

      ctx.restore()
      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [open, selected])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Conexiones</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 pb-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar notas, tareas, contactos..."
              className="w-full text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg pl-9 pr-3 py-2 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 placeholder-zinc-400"
            />
          </div>
        </div>

        {search && results.length > 0 && (
          <div className="p-4 pb-0 max-h-36 overflow-y-auto">
            <div className="space-y-0.5">
              {results.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm transition-colors ${
                    selected.find(s => s.id === item.id)
                      ? 'bg-[#7C9DD2]/20 text-zinc-800 dark:text-zinc-100'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-semibold uppercase shrink-0 w-14">{item.type}</span>
                  <span className="truncate">{item.label}</span>
                  {selected.find(s => s.id === item.id) && (
                    <span className="ml-auto text-xs text-[#7C9DD2]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 p-4" style={{ minHeight: 320 }}>
          {selected.length > 0 ? (
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg bg-zinc-950/5 dark:bg-zinc-950/30 touch-none"
              style={{ height: 300 }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-zinc-400" style={{ minHeight: 300 }}>
              Busca y selecciona elementos para visualizar sus conexiones
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3 px-4 pb-4">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nombre de la conexión..."
              className="flex-1 text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-1.5 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 placeholder-zinc-400"
            />
            <button
              onClick={() => { if (title.trim()) { onSave(title.trim(), selected.map(s => s.id)); onClose() } }}
              disabled={!title.trim()}
              className="text-sm px-4 py-1.5 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors font-medium disabled:opacity-40"
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
