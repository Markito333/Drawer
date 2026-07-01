export interface Folder {
  id: string
  name: string
  createdAt: number
}

export interface Note {
  id: string
  title: string
  content: string
  images: string[]
  imageCaptions: Record<string, string>
  folderId: string | null
  color?: string
  createdAt: number
  updatedAt: number
}

export interface SubTask {
  id: string
  text: string
  completed: boolean
}

export type TaskStatus = 'new' | 'pending' | 'in-progress' | 'completed'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  completed: boolean
  subtasks: SubTask[]
  images: string[]
  imageCaptions: Record<string, string>
  dueDate: number | null
  createdAt: number
  updatedAt: number
}

export interface Contact {
  id: string
  name: string
  phone: string
  photo?: string
  createdAt: number
  updatedAt: number
}

export interface MindMapNode {
  id: string
  text: string
  children: MindMapNode[]
}

export interface MindMap {
  id: string
  title: string
  nodes: MindMapNode[]
  createdAt: number
  updatedAt: number
}

export interface Connection {
  id: string
  title: string
  nodeIds: string[]
  createdAt: number
}

export interface AppData {
  notes: Note[]
  tasks: Task[]
  mindMaps: MindMap[]
  folders: Folder[]
  contacts: Contact[]
  connections: Connection[]
}
