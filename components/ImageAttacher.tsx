'use client'

import { useState } from 'react'
import { PhotoIcon, XMarkIcon, PencilIcon } from './Icons'
import ConfirmModal from './ConfirmModal'

interface Props {
  images: string[]
  captions: Record<string, string>
  onAdd: (url: string) => void
  onRemove: (url: string) => void
  onEditCaption: (url: string, caption: string) => void
  openAdd?: boolean
  onOpenAddChange?: (open: boolean) => void
}

export default function ImageAttacher({ images, captions, onAdd, onRemove, onEditCaption, openAdd, onOpenAddChange }: Props) {
  const [url, setUrl] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [removingImg, setRemovingImg] = useState<string | null>(null)
  const [editingCaption, setEditingCaption] = useState<string | null>(null)
  const [captionText, setCaptionText] = useState('')

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
          onClick={() => setViewerUrl(null)}
        >
          <img
            src={viewerUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
