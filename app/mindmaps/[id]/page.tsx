'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { MindMap, MindMapNode } from '@/lib/types'
import { getMindMap, updateMindMap, deleteMindMap, createConnection } from '@/lib/storage'
import { PlusIcon, XMarkIcon, BackArrowIcon } from '@/components/Icons'
import ConfirmModal from '@/components/ConfirmModal'
import ConnectionsModal from '@/components/ConnectionsModal'

function countNodes(nodes: MindMapNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0)
}

function NodeEditor({ node, onUpdate, depth }: {
  node: MindMapNode
  onUpdate: (node: MindMapNode) => void
  depth: number
}) {
  const addChild = () => {
    const child: MindMapNode = {
      id: crypto.randomUUID(),
      text: 'Nuevo nodo',
      children: [],
    }
    onUpdate({ ...node, children: [...node.children, child] })
  }

  const updateChild = (childId: string, updated: MindMapNode) => {
    onUpdate({
      ...node,
      children: node.children.map(c => c.id === childId ? updated : c),
    })
  }

  const removeChild = (childId: string) => {
    onUpdate({
      ...node,
      children: node.children.filter(c => c.id !== childId),
    })
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 group">
        {depth > 0 && (
          <div className="w-4 h-px bg-zinc-300 dark:bg-zinc-600 shrink-0" />
        )}
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 min-w-[120px]">
          <input
            type="text"
            value={node.text}
            onChange={e => onUpdate({ ...node, text: e.target.value })}
            className="flex-1 text-sm bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100"
          />
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={addChild} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
            {depth > 0 && (
              <button onClick={() => removeChild(node.id)} className="text-zinc-400 hover:text-red-500">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="ml-6 pl-4 border-l border-zinc-200 dark:border-zinc-700 mt-1 space-y-1">
          {node.children.map(child => (
            <NodeEditor
              key={child.id}
              node={child}
              onUpdate={updated => updateChild(child.id, updated)}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MindMapPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [mindMap, setMindMap] = useState<MindMap | null>(null)
  const [title, setTitle] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showConnections, setShowConnections] = useState(false)

  useEffect(() => {
    const m = getMindMap(id)
    if (!m) { router.replace('/mindmaps'); return }
    setMindMap(m)
    setTitle(m.title)
  }, [id, router])

  const save = useCallback(() => {
    if (!mindMap) return
    updateMindMap(id, { title, nodes: mindMap.nodes })
  }, [id, title, mindMap])

  useEffect(() => {
    if (!mindMap) return
    const timer = setTimeout(save, 300)
    return () => clearTimeout(timer)
  }, [title, mindMap?.nodes, save, mindMap])

  const confirmDelete = () => {
    deleteMindMap(id)
    router.replace('/mindmaps')
  }

  const updateRootNode = (updated: MindMapNode) => {
    if (!mindMap) return
    setMindMap({ ...mindMap, nodes: [updated] })
  }

  const handleSaveConnections = (title: string, nodeIds: string[]) => {
    createConnection({ id: crypto.randomUUID(), title, nodeIds, createdAt: Date.now() })
  }

  if (!mindMap) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/mindmaps')} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <BackArrowIcon className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConnections(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Conexiones
          </button>
          <button onClick={() => setShowConfirm(true)} className="text-sm text-zinc-400 hover:text-red-500 transition-colors">
            Eliminar
          </button>
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título del mapa"
        className="w-full text-xl font-semibold bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600"
      />

      <div className="py-4">
        {mindMap.nodes.map(node => (
          <NodeEditor
            key={node.id}
            node={node}
            onUpdate={updateRootNode}
            depth={0}
          />
        ))}
      </div>

      <p className="text-[10px] text-zinc-400">{countNodes(mindMap.nodes)} nodos en total</p>

      <ConnectionsModal open={showConnections} onClose={() => setShowConnections(false)} onSave={handleSaveConnections} />

      <ConfirmModal
        open={showConfirm}
        title="Eliminar mapa mental"
        message="¿Estás seguro de eliminar este mapa mental? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
