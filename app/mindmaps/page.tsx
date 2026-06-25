'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MindMap, Connection } from '@/lib/types'
import { getMindMaps, createMindMap, deleteMindMap, getConnections, deleteConnection, createConnection, updateConnection } from '@/lib/storage'
import { PlusIcon, XMarkIcon, BackArrowIcon } from '@/components/Icons'
import ConfirmModal from '@/components/ConfirmModal'
import ConnectionsModal from '@/components/ConnectionsModal'

export default function MindMapsPage() {
  const router = useRouter()
  const [mindMaps, setMindMaps] = useState<MindMap[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [showConnections, setShowConnections] = useState(false)
  const [editConn, setEditConn] = useState<Connection | null>(null)

  useEffect(() => {
    setMindMaps(getMindMaps())
    setConnections(getConnections())
  }, [])

  const handleCreate = () => {
    const id = crypto.randomUUID()
    createMindMap({
      id,
      title: 'Nuevo mapa',
      nodes: [{ id: crypto.randomUUID(), text: 'Idea central', children: [] }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    router.push(`/mindmaps/${id}`)
  }

  const confirmDelete = () => {
    if (!deleteTargetId) return
    if (deleteTargetId.startsWith('conn_')) {
      deleteConnection(deleteTargetId.slice(5))
      setConnections(getConnections())
    } else {
      deleteMindMap(deleteTargetId)
      setMindMaps(getMindMaps())
    }
    setDeleteTargetId(null)
  }

  const openConnection = (conn: Connection) => {
    setEditConn(conn)
    setShowConnections(true)
  }

  const handleSaveConnections = (title: string, nodeIds: string[]) => {
    if (editConn) {
      updateConnection(editConn.id, { title, nodeIds })
      setConnections(getConnections())
    } else {
      createConnection({ id: crypto.randomUUID(), title, nodeIds, createdAt: Date.now() })
      setConnections(getConnections())
    }
    setEditConn(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="relative flex items-center justify-center min-h-[48px]">
        <Link href="/" className="absolute left-0 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <BackArrowIcon className="w-4 h-4" />
          Inicio
        </Link>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Mapas Mentales</h2>
          <p className="text-sm text-zinc-400">{mindMaps.length} mapas</p>
        </div>
        <button
          onClick={handleCreate}
          className="absolute right-0 flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[#7C9DD2] text-white hover:bg-[#6B8DC2] dark:bg-[#7C9DD2]/40 dark:text-white dark:hover:bg-[#7C9DD2]/60 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nuevo mapa
        </button>
      </div>

      {mindMaps.length === 0 && connections.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-400">No hay mapas mentales todavía</p>
          <button onClick={handleCreate} className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
            Crear el primer mapa
          </button>
        </div>
      ) : (
        <>
          {mindMaps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">Mapas</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {mindMaps.map(m => (
                  <Link
                    key={m.id}
                    href={`/mindmaps/${m.id}`}
                    className="group block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                        {m.title}
                      </h3>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteTargetId(m.id) }}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full p-1 transition-all"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {m.nodes.length} nodo{m.nodes.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-2">
                      {new Date(m.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {connections.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">Conexiones</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {connections.map(c => (
                  <button
                    key={c.id}
                    onClick={() => openConnection(c)}
                    className="group block w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                        {c.title}
                      </h3>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTargetId('conn_' + c.id) }}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full p-1 transition-all shrink-0 ml-2"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {c.nodeIds.length} elemento{c.nodeIds.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-2">
                      {new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ConnectionsModal
        open={showConnections}
        onClose={() => { setShowConnections(false); setEditConn(null) }}
        onSave={handleSaveConnections}
        initialTitle={editConn?.title}
        initialNodeIds={editConn?.nodeIds}
      />

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
