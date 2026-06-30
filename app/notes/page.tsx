'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Note, Folder } from '@/lib/types'
import { getNotes, createNote, deleteNote, updateNote, reorderNotes, getFolders, createFolder, deleteFolder } from '@/lib/storage'
import { getLinkCount } from '@/lib/links'
import { PlusIcon, XMarkIcon, FolderIcon, BackArrowIcon } from '@/components/Icons'
import ConfirmModal from '@/components/ConfirmModal'
import SearchBar from '@/components/SearchBar'

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesPageContent />
    </Suspense>
  )
}

function NotesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderName, setFolderName] = useState('')
  const folderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showFolderModal) {
      setTimeout(() => folderInputRef.current?.focus(), 50)
    }
  }, [showFolderModal])

  useEffect(() => {
    const folderParam = searchParams.get('folder')
    if (folderParam) setCurrentFolder(folderParam)
  }, [searchParams])

  const refresh = useCallback(() => {
    setNotes(getNotes())
    setFolders(getFolders())
  }, [])

  useEffect(() => {
    refresh()
    setLoading(false)
  }, [refresh])

  const q = search.toLowerCase().trim()
  const searchedNotes = q ? notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) : null
  const filteredNotes = searchedNotes ?? notes.filter(n => n.folderId === currentFolder)
  const currentFolderData = currentFolder ? folders.find(f => f.id === currentFolder) : null

  const handleCreateNote = () => {
    const id = crypto.randomUUID()
    createNote({
      id,
      title: 'Nueva nota',
      content: '',
      images: [],
      imageCaptions: {},
      folderId: currentFolder,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    router.push(`/notes/${id}`)
  }

  const handleCreateFolder = () => {
    setFolderName('')
    setShowFolderModal(true)
  }

  const handleFolderCreate = () => {
    if (!folderName.trim()) return
    createFolder({
      id: crypto.randomUUID(),
      name: folderName.trim(),
      createdAt: Date.now(),
    })
    setShowFolderModal(false)
    setFolderName('')
    refresh()
  }

  const confirmDelete = () => {
    if (!deleteTargetId) return
    const target = notes.find(n => n.id === deleteTargetId)
    if (target) {
      deleteNote(deleteTargetId)
    } else {
      deleteFolder(deleteTargetId)
    }
    refresh()
    setDeleteTargetId(null)
  }

  const handleDragStart = (id: string) => {
    setDragId(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return

    const ids = filteredNotes.map(n => n.id)
    const fromIdx = ids.indexOf(dragId)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return

    ids.splice(fromIdx, 1)
    ids.splice(toIdx, 0, dragId)

    reorderNotes(ids)
    refresh()
  }

  const handleDragEnd = () => {
    setDragId(null)
    setDragOverFolderId(null)
  }

  if (loading) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="relative flex items-center justify-center min-h-[48px]">
        {currentFolder ? (
          <button onClick={() => setCurrentFolder(null)} className="absolute left-0 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <BackArrowIcon className="w-4 h-4" />
            <span>Notas</span>
          </button>
        ) : (
          <Link href="/" className="absolute left-0 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <BackArrowIcon className="w-4 h-4" />
            Inicio
          </Link>
        )}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            {currentFolderData ? currentFolderData.name : 'Notas'}
          </h2>
          <p className="text-sm text-zinc-400">{filteredNotes.length} notas</p>
        </div>
        <div className="absolute right-0 flex items-center gap-2">
          {!currentFolder && (
            <button
              onClick={handleCreateFolder}
              className="flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <FolderIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Nueva nota
          </button>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar en todas las notas..." />

      {!currentFolder && !search && folders.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {folders.map(folder => {
            const count = notes.filter(n => n.folderId === folder.id).length
            return (
              <div
                key={folder.id}
                role="button"
                tabIndex={0}
                onClick={() => setCurrentFolder(folder.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setCurrentFolder(folder.id) }}
                onDragOver={e => {
                  if (!dragId) return
                  e.preventDefault()
                  setDragOverFolderId(folder.id)
                }}
                onDragLeave={e => {
                  if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverFolderId(null)
                  }
                }}
                onDrop={e => {
                  e.preventDefault()
                  if (dragId) {
                    updateNote(dragId, { folderId: folder.id })
                    refresh()
                  }
                  setDragOverFolderId(null)
                  setDragId(null)
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors group relative cursor-pointer ${
                  dragId && dragOverFolderId === folder.id
                    ? 'bg-[#7C9DD2]/20 dark:bg-[#7C9DD2]/30 ring-2 ring-[#7C9DD2]'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <FolderIcon className="w-10 h-10 text-amber-400" />
                <div className="text-center">
                  <p className="text-xs text-zinc-800 dark:text-zinc-100 truncate max-w-24">{folder.name}</p>
                  <p className="text-[10px] text-zinc-400">{count} {count === 1 ? 'nota' : 'notas'}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteTargetId(folder.id) }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full p-0.5 transition-all cursor-pointer"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {filteredNotes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-400">
            {search ? 'No se encontraron notas' : currentFolder ? 'No hay notas en esta carpeta' : 'No hay notas todavía'}
          </p>
          {!search && (
            <button onClick={handleCreateNote} className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              Crear la primera nota
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note, idx) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              draggable
              onDragStart={() => handleDragStart(note.id)}
              onDragOver={e => handleDragOver(e, note.id)}
              onDragEnd={handleDragEnd}
              className={`group flex flex-col p-4 rounded-xl border transition-colors ${
                dragId === note.id
                  ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 opacity-50'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug">
                    {note.title || 'Sin título'}
                  </p>
                  {(() => {
                    const lc = getLinkCount(note.content)
                    return lc > 0 ? (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 mt-1 inline-block">
                        {lc} enlace{lc !== 1 ? 's' : ''}
                      </span>
                    ) : null
                  })()}
                </div>
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteTargetId(note.id) }}
                  className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full p-0.5 transition-all shrink-0"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed flex-1">
                {note.content ? note.content.replace(/<[^>]+>/g, '').substring(0, 120) : 'Sin contenido'}
              </p>
              <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-3">
                {new Date(note.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={() => setShowFolderModal(false)}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-xs mx-4 p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Nueva carpeta</h3>
            <input
              ref={folderInputRef}
              type="text"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleFolderCreate() }}
              placeholder="Nombre de la carpeta"
              className="w-full text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 placeholder-zinc-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowFolderModal(false)}
                className="flex-1 text-sm px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFolderCreate}
                className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors font-medium"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="Eliminar"
        message="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}
