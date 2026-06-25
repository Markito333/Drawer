'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Note } from '@/lib/types'
import { getNote, updateNote, deleteNote, getContacts, createContact, getFolders } from '@/lib/storage'
import { getLinkCount, extractNamePhonePairs } from '@/lib/links'
import { technologies } from '@/lib/technologies'
import ImageAttacher from '@/components/ImageAttacher'
import TextEditor from '@/components/TextEditor'
import DrawingPad from '@/components/DrawingPad'
import { BackArrowIcon, ContactIcon, XMarkIcon, PhotoIcon, TechIcon, SearchIcon, TaskIcon, PencilIcon } from '@/components/Icons'
import type { Contact } from '@/lib/types'
import ConfirmModal from '@/components/ConfirmModal'

export default function NotePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [note, setNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imageCaptions, setImageCaptions] = useState<Record<string, string>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [showImageInput, setShowImageInput] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [showTechPicker, setShowTechPicker] = useState(false)
  const [selectedTechs, setSelectedTechs] = useState<Set<string>>(new Set())
  const [showDrawingPad, setShowDrawingPad] = useState(false)
  const [techSearch, setTechSearch] = useState('')
  const linkCount = getLinkCount(content)

  const isProjectFolder = (() => {
    if (!note?.folderId) return false
    const folders = getFolders()
    const folder = folders.find(f => f.id === note.folderId)
    if (!folder) return false
    const name = folder.name.toLowerCase()
    return name === 'proyectos' || name === 'projects'
  })()

  useEffect(() => {
    const n = getNote(id)
    if (!n) { router.replace('/notes'); return }
    setNote(n)
    setTitle(n.title)
    setContent(n.content)
    setImages(n.images)
    setImageCaptions(n.imageCaptions ?? {})
  }, [id, router])

  const backPath = note?.folderId ? `/notes?folder=${note.folderId}` : '/notes'

  useEffect(() => {
    if (!note) return
    const timer = setTimeout(() => {
      updateNote(id, { title, content, images, imageCaptions })
    }, 300)
    return () => clearTimeout(timer)
  }, [title, content, images, imageCaptions, id, note])

  useEffect(() => {
    if (!content) return
    const detected = extractNamePhonePairs(content)
    const existing = getContacts()
    for (const { name, phone } of detected) {
      const dup = existing.find(c => c.phone === phone || c.name.toLowerCase() === name.toLowerCase())
      if (!dup) {
        createContact({
          id: crypto.randomUUID(),
          name,
          phone,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      }
    }
  }, [content])

  const confirmDelete = () => {
    deleteNote(id)
    router.replace('/notes')
  }

  const openContactPicker = () => {
    setContacts(getContacts())
    setShowContactPicker(true)
  }

  const insertContact = (contact: Contact) => {
    const html = `<b>${contact.name}</b> ${contact.phone}<br>`
    const editor = document.querySelector('[contenteditable]') as HTMLElement | null
    if (editor) {
      editor.focus()
      document.execCommand('insertHTML', false, html)
      setContent(editor.innerHTML)
    }
    setShowContactPicker(false)
  }

  const insertTask = () => {
    const html = `<div class="py-0.5 text-sm text-zinc-800 dark:text-zinc-100"><input type="checkbox" class="w-4 h-4 accent-green-500 align-middle" contenteditable="false" /><span class="ml-1.5 align-middle">Nueva tarea</span></div>`
    const editor = document.querySelector('[contenteditable]') as HTMLElement | null
    if (editor) {
      editor.focus()
      document.execCommand('insertHTML', false, html)
      setContent(editor.innerHTML)
    }
  }

  const handleAddImage = (url: string) => {
    setImages(prev => [...prev, url])
  }

  const handleRemoveImage = (url: string) => {
    setImages(prev => prev.filter(u => u !== url))
  }

  const handleEditCaption = (url: string, caption: string) => {
    setImageCaptions(prev => ({ ...prev, [url]: caption }))
  }

  const handleSaveDrawing = (dataUrl: string) => {
    setImages(prev => [...prev, dataUrl])
  }

  if (!note) return null

  return (
    <div className="max-w-2xl mx-auto space-y-4 min-h-screen bg-zinc-50 dark:bg-zinc-950" style={{ backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(backPath)} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <BackArrowIcon className="w-4 h-4" />
          Volver
        </button>
        <button onClick={() => setShowConfirm(true)} className="text-sm text-zinc-400 hover:text-red-500 transition-colors">
          Eliminar
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título de la nota"
          className="flex-1 text-xl font-semibold bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600"
        />
        {linkCount > 0 && (
          <span className="shrink-0 text-[10px] font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            {linkCount} enlace{linkCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={openContactPicker}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="Insertar contacto"
        >
          <span className="text-sm font-medium leading-none">+</span>
          <ContactIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowImageInput(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="Añadir imagen"
        >
          <span className="text-sm font-medium leading-none">+</span>
          <PhotoIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowDrawingPad(true)}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="Dibujar"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={insertTask}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="Insertar tarea"
        >
          <span className="text-sm font-medium leading-none">+</span>
          <TaskIcon className="w-3.5 h-3.5" />
        </button>
        {isProjectFolder && (
          <button
            onClick={() => { setSelectedTechs(new Set()); setShowTechPicker(true) }}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            title="Añadir tecnologías"
          >
            <span className="text-sm font-medium leading-none">+</span>
            <TechIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <TextEditor
        value={content}
        onChange={setContent}
        placeholder="Escribe aquí..."
        minHeight="200px"
      />

      <ImageAttacher images={images} captions={imageCaptions} onAdd={handleAddImage} onRemove={handleRemoveImage} onEditCaption={handleEditCaption} openAdd={showImageInput} onOpenAddChange={setShowImageInput} />

      <DrawingPad open={showDrawingPad} onSave={handleSaveDrawing} onClose={() => setShowDrawingPad(false)} />

      {showContactPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={() => { setShowContactPicker(false); setContactSearch('') }}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-sm mx-4 max-h-[60vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Insertar contacto</h3>
              <button onClick={() => { setShowContactPicker(false); setContactSearch('') }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <SearchIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Buscar contacto..."
                  className="flex-1 text-sm bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                />
              </div>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {contacts.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">No hay contactos guardados</p>
              ) : (
                (() => {
                  const q = contactSearch.toLowerCase().trim()
                  const filtered = q ? contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)) : contacts
                  return filtered.length === 0 ? (
                    <p className="text-sm text-zinc-400 text-center py-8">No se encontraron contactos</p>
                  ) : (
                    filtered.map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => insertContact(contact)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-xs font-semibold text-pink-600 dark:text-pink-300 shrink-0">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{contact.name}</p>
                          <p className="text-xs text-zinc-400 truncate">{contact.phone}</p>
                        </div>
                      </button>
                    ))
                  )
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {showTechPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={() => { setShowTechPicker(false); setTechSearch('') }}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-lg mx-4 max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Tecnologías</h3>
              <button onClick={() => { setShowTechPicker(false); setTechSearch('') }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <SearchIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={techSearch}
                  onChange={e => setTechSearch(e.target.value)}
                  placeholder="Buscar tecnología..."
                  className="flex-1 text-sm bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-5 gap-3">
                {(() => {
                  const q = techSearch.toLowerCase().trim()
                  const filtered = q ? technologies.filter(t => t.name.toLowerCase().includes(q)) : technologies
                  return filtered.length === 0 ? (
                    <p className="col-span-5 text-sm text-zinc-400 text-center py-8">No se encontraron tecnologías</p>
                  ) : (
                    filtered.map(tech => {
                      const isSelected = selectedTechs.has(tech.name)
                      return (
                        <button
                          key={tech.name}
                          onClick={() => {
                            const next = new Set(selectedTechs)
                            if (isSelected) next.delete(tech.name)
                            else next.add(tech.name)
                            setSelectedTechs(next)
                          }}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
                            isSelected
                              ? 'bg-[#7C9DD2]/20 dark:bg-[#7C9DD2]/30 ring-2 ring-[#7C9DD2]'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <img src={tech.icon} alt={tech.name} className="w-8 h-8" />
                          <span className="text-[10px] text-zinc-600 dark:text-zinc-400 text-center leading-tight">{tech.name}</span>
                        </button>
                      )
                    })
                  )
                })()}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <p className="text-xs text-zinc-400">{selectedTechs.size} seleccionada{selectedTechs.size !== 1 ? 's' : ''}</p>
              <button
                onClick={() => {
                  if (selectedTechs.size === 0) return
                  const html = `<div class="flex gap-2 flex-wrap">${Array.from(selectedTechs).map(name => {
                    const tech = technologies.find(t => t.name === name)
                    return tech ? `<img src="${tech.icon}" alt="${tech.name}" title="${tech.name}" style="width:28px;height:28px" />` : ''
                  }).join('')}</div>`
                  const editor = document.querySelector('[contenteditable]') as HTMLElement | null
                  if (editor) {
                    editor.focus()
                    document.execCommand('insertHTML', false, html)
                    setContent(editor.innerHTML)
                  }
                  setShowTechPicker(false)
                }}
                className="text-sm px-4 py-2 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors"
              >
                Insertar {selectedTechs.size > 0 ? `(${selectedTechs.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirm}
        title="Eliminar nota"
        message="¿Estás seguro de eliminar esta nota? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
