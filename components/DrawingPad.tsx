'use client'

import { useRef, useState, useEffect } from 'react'
import { XMarkIcon } from '@/components/Icons'

interface Props {
  open: boolean
  onSave: (dataUrl: string) => void
  onClose: () => void
}

export default function DrawingPad({ open, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [color, setColor] = useState('#1e1e1e')
  const [lineWidth, setLineWidth] = useState(3)

  useEffect(() => {
    if (!open) return
    setHasDrawn(false)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [open])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
  }, [color, lineWidth])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL('image/png'))
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Dibujar</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <canvas
            ref={canvasRef}
            className="w-full h-64 rounded-lg border border-zinc-200 dark:border-zinc-700 touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {['#1e1e1e', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? 'border-zinc-800 dark:border-zinc-200 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[2, 4, 6].map(w => (
                <button
                  key={w}
                  onClick={() => setLineWidth(w)}
                  className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-medium transition-colors ${
                    lineWidth === w
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasDrawn && (
              <button
                onClick={clearCanvas}
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasDrawn}
              className="text-xs px-4 py-1.5 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors font-medium disabled:opacity-40"
            >
              Insertar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
