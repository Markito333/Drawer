'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Contact } from '@/lib/types'
import { getContacts, createContact, deleteContact, updateContact } from '@/lib/storage'
import { getCountryInfo } from '@/lib/links'
import { BackArrowIcon, PlusIcon, XMarkIcon } from '@/components/Icons'
import ConfirmModal from '@/components/ConfirmModal'
import SearchBar from '@/components/SearchBar'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newPhoto, setNewPhoto] = useState('')

  useEffect(() => {
    setContacts(getContacts())
  }, [])

  const refresh = () => setContacts(getContacts())

  const resetForm = () => {
    setNewName('')
    setNewPhone('')
    setNewPhoto('')
  }

  const handleCreate = () => {
    if (!newName.trim() || !newPhone.trim()) return
    createContact({
      id: crypto.randomUUID(),
      name: newName.trim(),
      phone: newPhone.trim(),
      photo: newPhoto.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    setShowCreate(false)
    resetForm()
    refresh()
  }

  const confirmDelete = () => {
    if (!deleteTargetId) return
    deleteContact(deleteTargetId)
    setDeleteTargetId(null)
    refresh()
  }

  const handleEdit = (contact: Contact) => {
    setEditTargetId(contact.id)
    setNewName(contact.name)
    setNewPhone(contact.phone)
    setNewPhoto(contact.photo ?? '')
  }

  const handleSaveEdit = () => {
    if (!editTargetId || !newName.trim() || !newPhone.trim()) return
    updateContact(editTargetId, {
      name: newName.trim(),
      phone: newPhone.trim(),
      photo: newPhoto.trim() || undefined,
    })
    setEditTargetId(null)
    resetForm()
    refresh()
  }

  const q = search.toLowerCase().trim()
  const displayed = q
    ? contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
    : contacts

  const fieldClass = "w-full text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 placeholder-zinc-400"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="relative flex items-center justify-center min-h-[48px]">
        <Link href="/" className="absolute left-0 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <BackArrowIcon className="w-4 h-4" />
          Inicio
        </Link>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Contactos</h2>
          <p className="text-sm text-zinc-400">{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { resetForm(); setShowCreate(true) }} className="absolute right-0 flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors">
          <PlusIcon className="w-4 h-4" />
          Nuevo contacto
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar contactos..." />

      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-400">
            {search ? 'No se encontraron contactos' : 'No hay contactos todavía'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {displayed.map(contact => {
            const country = getCountryInfo(contact.phone)
            return (
              <div key={contact.id} className="relative flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-center group">
                <button
                  onClick={() => setDeleteTargetId(contact.id)}
                  className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full p-0.5 transition-all opacity-0 group-hover:opacity-100"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
                {contact.photo ? (
                  <img src={contact.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-sm font-semibold text-pink-600 dark:text-pink-300 shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 w-full">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{contact.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{contact.phone}</span>
                    {country && (
                      <span className="text-[10px] text-zinc-400" title={country.name}>
                        {country.flag}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(contact)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                >
                  Editar
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={() => setShowCreate(false)}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Nuevo contacto</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nombre completo"
                className={fieldClass}
                autoFocus
              />
              <input
                type="text"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Teléfono (ej: +53 55531928)"
                className={fieldClass}
              />
              {newPhone && (() => {
                const country = getCountryInfo(newPhone)
                return country ? (
                  <p className="text-xs text-zinc-500">{country.flag} {country.name}</p>
                ) : null
              })()}
              <input
                type="text"
                value={newPhoto}
                onChange={e => setNewPhoto(e.target.value)}
                placeholder="URL de foto (opcional)"
                className={fieldClass}
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors font-medium"
                >
                  Crear contacto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTargetId && (() => {
        const contact = contacts.find(c => c.id === editTargetId)
        if (!contact) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={() => setEditTargetId(null)}>
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-md mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Editar contacto</h3>
                <button onClick={() => setEditTargetId(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nombre completo"
                  className={fieldClass}
                  autoFocus
                />
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="Teléfono"
                  className={fieldClass}
                />
                {newPhone && (() => {
                  const country = getCountryInfo(newPhone)
                  return country ? (
                    <p className="text-xs text-zinc-500">{country.flag} {country.name}</p>
                  ) : null
                })()}
                <input
                  type="text"
                  value={newPhoto}
                  onChange={e => setNewPhoto(e.target.value)}
                  placeholder="URL de foto (opcional)"
                  className={fieldClass}
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditTargetId(null)}
                    className="flex-1 text-sm px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 text-sm px-4 py-2 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors font-medium"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="Eliminar contacto"
        message="¿Estás seguro de eliminar este contacto? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}
