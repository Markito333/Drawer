'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Task, SubTask } from '@/lib/types'
import { getTasks, createTask, updateTask, deleteTask, getContacts, createContact } from '@/lib/storage'
import { getLinkCount, linkifyHTML, extractNamePhonePairs } from '@/lib/links'
import ImageAttacher from '@/components/ImageAttacher'
import TextEditor from '@/components/TextEditor'
import { BackArrowIcon, CheckCircleIcon, CircleIcon, XMarkIcon, PlusIcon } from '@/components/Icons'
import ConfirmModal from '@/components/ConfirmModal'
import SearchBar from '@/components/SearchBar'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [modalTaskId, setModalTaskId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newSubtasks, setNewSubtasks] = useState<SubTask[]>([])
  const [newImages, setNewImages] = useState<string[]>([])
  const [newCaptions, setNewCaptions] = useState<Record<string, string>>({})

  useEffect(() => {
    setTasks(getTasks())
  }, [])

  const refresh = () => setTasks(getTasks())

  const resetCreateForm = () => {
    setNewTitle('')
    setNewDescription('')
    setNewDueDate('')
    setNewSubtasks([])
    setNewImages([])
    setNewCaptions({})
  }

  const openCreate = () => {
    resetCreateForm()
    setNewSubtasks([{ id: crypto.randomUUID(), text: '', completed: false }])
    setShowCreate(true)
  }

  const autoCreateContacts = (text: string) => {
    const detected = extractNamePhonePairs(text)
    if (detected.length === 0) return
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
  }

  const handleCreate = () => {
    if (!newTitle.trim()) return
    createTask({
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDescription,
      completed: false,
      subtasks: newSubtasks,
      images: newImages,
      imageCaptions: newCaptions,
      dueDate: newDueDate ? new Date(newDueDate).getTime() : null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    autoCreateContacts(newTitle + ' ' + newDescription)
    setShowCreate(false)
    resetCreateForm()
    refresh()
  }

  const addNewSubtask = () => {
    setNewSubtasks(prev => [...prev, { id: crypto.randomUUID(), text: '', completed: false }])
  }

  const updateNewSubtask = (id: string, text: string) => {
    setNewSubtasks(prev => prev.map(s => s.id === id ? { ...s, text } : s))
  }

  const removeNewSubtask = (id: string) => {
    setNewSubtasks(prev => prev.filter(s => s.id !== id))
  }

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    updateTask(id, { completed: !task.completed })
    refresh()
  }

  const confirmDelete = () => {
    if (!deleteTargetId) return
    deleteTask(deleteTargetId)
    if (modalTaskId === deleteTargetId) setModalTaskId(null)
    setDeleteTargetId(null)
    refresh()
  }

  const updateTaskField = (id: string, field: 'title' | 'description', value: string) => {
    updateTask(id, { [field]: value })
    autoCreateContacts(value)
    refresh()
  }

  const toggleSubtask = (taskId: string, subId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const subtasks = task.subtasks.map(s =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    )
    updateTask(taskId, { subtasks })
    refresh()
  }

  const addSubtask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const sub: SubTask = {
      id: crypto.randomUUID(),
      text: '',
      completed: false,
    }
    updateTask(taskId, { subtasks: [...task.subtasks, sub] })
    refresh()
  }

  const updateSubtask = (taskId: string, subId: string, text: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const subtasks = task.subtasks.map(s =>
      s.id === subId ? { ...s, text } : s
    )
    updateTask(taskId, { subtasks })
    refresh()
  }

  const removeSubtask = (taskId: string, subId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    updateTask(taskId, { subtasks: task.subtasks.filter(s => s.id !== subId) })
    refresh()
  }

  const handleAddImage = (taskId: string, url: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    updateTask(taskId, { images: [...task.images, url] })
    refresh()
  }

  const handleRemoveImage = (taskId: string, url: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    updateTask(taskId, { images: task.images.filter(u => u !== url) })
    refresh()
  }

  const handleEditCaption = (taskId: string, url: string, caption: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    updateTask(taskId, { imageCaptions: { ...(task.imageCaptions ?? {}), [url]: caption } })
    refresh()
  }

  const updateDate = (taskId: string, value: string) => {
    updateTask(taskId, { dueDate: value ? new Date(value).getTime() : null })
    refresh()
  }

  const modalTask = modalTaskId ? tasks.find(t => t.id === modalTaskId) : null

  const q = search.toLowerCase().trim()
  const displayedTasks = q
    ? tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    : tasks
  const sorted = [...displayedTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return b.updatedAt - a.updatedAt
  })

  const fieldClass = "w-full text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 placeholder-zinc-400"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="relative flex items-center justify-center min-h-[48px]">
        <Link href="/" className="absolute left-0 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <BackArrowIcon className="w-4 h-4" />
          Inicio
        </Link>
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Tareas</h2>
            {(() => {
              const totalLinks = tasks.reduce((sum, t) => sum + getLinkCount(t.title + ' ' + t.description), 0)
              return totalLinks > 0 ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                  {totalLinks} enlace{totalLinks !== 1 ? 's' : ''}
                </span>
              ) : null
            })()}
          </div>
          <p className="text-sm text-zinc-400">{tasks.filter(t => !t.completed).length} pendientes de {tasks.length}</p>
        </div>
        <button onClick={openCreate} className="absolute right-0 flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors">
          <PlusIcon className="w-4 h-4" />
          Nueva tarea
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar en todas las tareas..." />

      {sorted.length === 0 ? (
        search ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-400">No se encontraron tareas</p>
          </div>
        ) : null
      ) : (
      <div className="space-y-2">
        {sorted.map(task => {
          const subCompleted = task.subtasks.filter(s => s.completed).length
          return (
          <div key={task.id} className="group flex items-center gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition-colors">
            <button onClick={() => toggleTask(task.id)} className="shrink-0">
              {task.completed ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : (
                <CircleIcon className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                {task.title}
              </p>
            </div>
            <button
              onClick={() => setModalTaskId(task.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              Ver
            </button>
            <button onClick={() => setDeleteTargetId(task.id)} className="shrink-0 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full p-1 transition-colors opacity-0 group-hover:opacity-100">
              <XMarkIcon className="w-3 h-3" />
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
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Nueva tarea</h3>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Título de la tarea"
                className={fieldClass}
                autoFocus
              />
              <TextEditor
                value={newDescription}
                onChange={setNewDescription}
                placeholder="Descripción (opcional)"
                minHeight="80px"
              />
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className={fieldClass + " text-zinc-500 dark:text-zinc-400"}
              />

              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Subtareas</p>
                {newSubtasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 group">
                    <input
                      type="text"
                      value={sub.text}
                      onChange={e => updateNewSubtask(sub.id, e.target.value)}
                      placeholder="Subtarea..."
                      className={"flex-1 " + fieldClass + " py-1.5"}
                    />
                    <button
                      onClick={() => removeNewSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={addNewSubtask} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  <PlusIcon className="w-3 h-3" />
                  Añadir subtarea
                </button>
              </div>

              <ImageAttacher
                images={newImages}
                captions={newCaptions}
                onAdd={url => setNewImages(prev => [...prev, url])}
                onRemove={url => setNewImages(prev => prev.filter(u => u !== url))}
                onEditCaption={(url, caption) => setNewCaptions(prev => ({ ...prev, [url]: caption }))}
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
                  Crear tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {modalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={() => setModalTaskId(null)}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <input
                type="text"
                defaultValue={modalTask.title}
                onBlur={e => updateTaskField(modalTask.id, 'title', e.target.value)}
                className={"text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"}
              />
              <button onClick={() => setModalTaskId(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ml-2 shrink-0">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <TextEditor
                value={modalTask.description}
                onChange={html => updateTaskField(modalTask.id, 'description', html)}
                placeholder="Descripción (opcional)"
                minHeight="80px"
              />
              <input
                type="date"
                defaultValue={modalTask.dueDate ? new Date(modalTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={e => updateDate(modalTask.id, e.target.value)}
                className={fieldClass + " text-zinc-500 dark:text-zinc-400"}
              />

              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Subtareas</p>
                {modalTask.subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 group">
                    <button onClick={() => toggleSubtask(modalTask.id, sub.id)} className="shrink-0">
                      {sub.completed ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <CircleIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                      )}
                    </button>
                    <input
                      type="text"
                      defaultValue={sub.text}
                      onBlur={e => updateSubtask(modalTask.id, sub.id, e.target.value)}
                      placeholder="Subtarea..."
                      className={`flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 ${
                        sub.completed ? 'line-through decoration-yellow-400 text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'
                      } placeholder-zinc-400`}
                    />
                    <button
                      onClick={() => removeSubtask(modalTask.id, sub.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addSubtask(modalTask.id)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  <PlusIcon className="w-3 h-3" />
                  Añadir subtarea
                </button>
              </div>

              <ImageAttacher
                images={modalTask.images}
                captions={modalTask.imageCaptions ?? {}}
                onAdd={url => handleAddImage(modalTask.id, url)}
                onRemove={url => handleRemoveImage(modalTask.id, url)}
                onEditCaption={(url, caption) => handleEditCaption(modalTask.id, url, caption)}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="Eliminar tarea"
        message="¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}
