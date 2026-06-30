'use client'

import { useState, useRef, useEffect } from 'react'
import { PhotoIcon, XMarkIcon, PencilIcon } from './Icons'
import ConfirmModal from './ConfirmModal'

interface Props {
  images: string[]
  captions: Record<string, string>
  onAdd: (url: string) => void
  onRemove: (url: string) => void
  onEditCaption: (url: string, caption: string) => void
  onEditImage?: (oldUrl: string, newDataUrl: string) => void
  openAdd?: boolean
  onOpenAddChange?: (open: boolean) => void
}

export default function ImageAttacher({ images, captions, onAdd, onRemove, onEditCaption, onEditImage, openAdd, onOpenAddChange }: Props) {
  const [url, setUrl] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [removingImg, setRemovingImg] = useState<string | null>(null)
  const [editingCaption, setEditingCaption] = useState<string | null>(null)
  const [captionText, setCaptionText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [penColor, setPenColor] = useState('#ffffff')
  const [penWidth, setPenWidth] = useState(3)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasDrawnRef = useRef(false)

  const effectiveShowInput = openAdd ?? showInput
  const setEffectiveShowInput = (v: boolean) => {
    setShowInput(v)
    onOpenAddChange?.(v)
  }

  const handleAdd = () => {
    if (!url.trim()) return
    onAdd(url.trim())
    setUrl('')
    setEffectiveShowInput(false)
  }

  const startEditCaption = (img: string) => {
    setCaptionText(captions[img] ?? '')
    setEditingCaption(img)
  }

  const saveCaption = () => {
    if (!editingCaption) return
    onEditCaption(editingCaption, captionText)
    setEditingCaption(null)
    setCaptionText('')
  }

  useEffect(() => {
    if (!isEditing || !viewerUrl || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    hasDrawnRef.current = false
    const img = new Image()
    img.onload = () => {
      const maxW = window.innerWidth * 0.85
      const maxH = window.innerHeight * 0.7
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > maxW) { h = h * maxW / w; w = maxW }
      if (h > maxH) { w = w * maxH / h; h = maxH }
      w = Math.round(w)
      h = Math.round(h)

      canvas.width = w
      canvas.height = h
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.drawImage(img, 0, 0, w, h)
      ctx.strokeStyle = penColor
      ctx.lineWidth = penWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    img.crossOrigin = 'anonymous'
    img.src = viewerUrl
  }, [isEditing])

  useEffect(() => {
    if (!isEditing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = penColor
    ctx.lineWidth = penWidth
  }, [penColor, penWidth, isEditing])

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
    hasDrawnRef.current = true
  }

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDraw = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !viewerUrl) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
    }
    img.src = viewerUrl
    hasDrawnRef.current = false
  }

  const saveEdit = () => {
    const canvas = canvasRef.current
    if (!canvas || !viewerUrl) return
    if (!hasDrawnRef.current) {
      setIsEditing(false)
      return
    }
    const dataUrl = canvas.toDataURL('image/png')
    onEditImage?.(viewerUrl, dataUrl)
    setIsEditing(false)
    setViewerUrl(null)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="relative group">
                <img
                  src={img}
                  alt=""
                  className="w-24 h-24 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  onClick={() => setViewerUrl(img)}
                />
                <div className="absolute -top-1.5 right-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditCaption(img)}
                    className="w-5 h-5 bg-zinc-600 text-white rounded-full flex items-center justify-center hover:bg-zinc-500"
                  >
                    <PencilIcon className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => setRemovingImg(img)}
                    className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {captions[img] && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 text-center max-w-24 leading-tight">{captions[img]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {editingCaption !== null && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={captionText}
            onChange={e => setCaptionText(e.target.value)}
            placeholder="Texto para la imagen..."
            className="flex-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-1.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            onKeyDown={e => { if (e.key === 'Enter') saveCaption() }}
            autoFocus
          />
          <button onClick={saveCaption} className="text-xs px-3 py-1.5 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors">
            OK
          </button>
          <button onClick={() => setEditingCaption(null)} className="p-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {effectiveShowInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 placeholder-zinc-400"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            autoFocus
          />
          <button onClick={handleAdd} className="text-xs px-3 py-1.5 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors">
            Añadir
          </button>
          <button onClick={() => setEffectiveShowInput(false)} className="p-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : openAdd === undefined && (
        <button
          onClick={() => setEffectiveShowInput(true)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <PhotoIcon className="w-3.5 h-3.5" />
          Añadir imagen
        </button>
      )}
      <ConfirmModal
        open={!!removingImg}
        title="Eliminar imagen"
        message="¿Quitar esta imagen?"
        onConfirm={() => { if (removingImg) { onRemove(removingImg); setRemovingImg(null) } }}
        onCancel={() => setRemovingImg(null)}
      />
      {viewerUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => { if (!isEditing) setViewerUrl(null) }}
        >
          <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            {isEditing ? (
              <>
                <canvas
                  ref={canvasRef}
                  className="rounded-lg shadow-lg"
                  onMouseDown={startDraw}
                  onMouseMove={moveDraw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={moveDraw}
                  onTouchEnd={stopDraw}
                />
                <div className="flex items-center gap-1.5 bg-white/90 dark:bg-zinc-800/90 rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm">
                  <button
                    onClick={() => setPenColor('#000000')}
                    className={`w-7 h-7 rounded-full border-2 ${penColor === '#000000' ? 'border-zinc-400' : 'border-transparent'} flex items-center justify-center bg-black`}
                  >
                    {penColor === '#000000' && <span className="text-white text-[10px]">✓</span>}
                  </button>
                  <button
                    onClick={() => setPenColor('#ffffff')}
                    className={`w-7 h-7 rounded-full border-2 ${penColor === '#ffffff' ? 'border-zinc-400' : 'border-transparent'} flex items-center justify-center bg-white`}
                  >
                    {penColor === '#ffffff' && <span className="text-black text-[10px]">✓</span>}
                  </button>
                  <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600" />
                  <button
                    onClick={() => setPenWidth(2)}
                    className={`w-6 h-6 rounded text-[10px] font-medium ${penWidth === 2 ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                  >
                    S
                  </button>
                  <button
                    onClick={() => setPenWidth(5)}
                    className={`w-6 h-6 rounded text-xs font-medium ${penWidth === 5 ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => setPenWidth(8)}
                    className={`w-6 h-6 rounded text-sm font-medium ${penWidth === 8 ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                  >
                    L
                  </button>
                  <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600" />
                  <button onClick={clearCanvas} className="text-xs px-2 py-1 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    Limpiar
                  </button>
                  <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600" />
                  <button onClick={cancelEdit} className="text-xs px-2 py-1 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    Cancelar
                  </button>
                  <button onClick={saveEdit} className="text-xs px-3 py-1 rounded bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] transition-colors">
                    Guardar
                  </button>
                </div>
              </>
            ) : (
              <div className="relative">
                <img
                  src={viewerUrl}
                  alt=""
                  className="max-w-[85vw] max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/80 dark:bg-zinc-800/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 transition-colors shadow"
                  title="Editar imagen"
                >
                  <PencilIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
