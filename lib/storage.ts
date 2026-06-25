'use client'

import type { AppData, Note, Task, MindMap, Folder, Contact, Connection } from './types'

const STORAGE_KEY = 'organizer-data'

function getData(): AppData {
  if (typeof window === 'undefined') return { notes: [], tasks: [], mindMaps: [], folders: [], contacts: [], connections: [] }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { notes: [], tasks: [], mindMaps: [], folders: [], contacts: [], connections: [] }
  const data = JSON.parse(raw)
  return {
    notes: (data.notes ?? []).map((n: Note) => ({ ...n, imageCaptions: n.imageCaptions ?? {} })),
    tasks: (data.tasks ?? []).map((t: Task) => ({ ...t, imageCaptions: t.imageCaptions ?? {} })),
    mindMaps: data.mindMaps ?? [],
    folders: data.folders ?? [],
    contacts: data.contacts ?? [],
    connections: data.connections ?? [],
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Folders
export function getFolders(): Folder[] {
  return getData().folders
}

export function createFolder(folder: Folder) {
  const data = getData()
  data.folders.unshift(folder)
  saveData(data)
}

export function updateFolder(id: string, updates: Partial<Folder>) {
  const data = getData()
  const idx = data.folders.findIndex(f => f.id === id)
  if (idx === -1) return
  data.folders[idx] = { ...data.folders[idx], ...updates }
  saveData(data)
}

export function deleteFolder(id: string) {
  const data = getData()
  data.folders = data.folders.filter(f => f.id !== id)
  data.notes = data.notes.filter(n => n.folderId !== id)
  saveData(data)
}

// Notes
export function getNotes(): Note[] {
  return getData().notes
}

export function getNote(id: string): Note | undefined {
  return getData().notes.find(n => n.id === id)
}

export function createNote(note: Note) {
  const data = getData()
  data.notes.unshift(note)
  saveData(data)
}

export function updateNote(id: string, updates: Partial<Note>) {
  const data = getData()
  const idx = data.notes.findIndex(n => n.id === id)
  if (idx === -1) return
  data.notes[idx] = { ...data.notes[idx], ...updates, updatedAt: Date.now() }
  saveData(data)
}

export function deleteNote(id: string) {
  const data = getData()
  data.notes = data.notes.filter(n => n.id !== id)
  saveData(data)
}

export function reorderNotes(ids: string[]) {
  const data = getData()
  const map = new Map(data.notes.map(n => [n.id, n]))
  data.notes = ids.map(id => map.get(id)).filter(Boolean) as Note[]
  saveData(data)
}

// Tasks
export function getTasks(): Task[] {
  return getData().tasks
}

export function getTask(id: string): Task | undefined {
  return getData().tasks.find(t => t.id === id)
}

export function createTask(task: Task) {
  const data = getData()
  data.tasks.unshift(task)
  saveData(data)
}

export function updateTask(id: string, updates: Partial<Task>) {
  const data = getData()
  const idx = data.tasks.findIndex(t => t.id === id)
  if (idx === -1) return
  data.tasks[idx] = { ...data.tasks[idx], ...updates, updatedAt: Date.now() }
  saveData(data)
}

export function deleteTask(id: string) {
  const data = getData()
  data.tasks = data.tasks.filter(t => t.id !== id)
  saveData(data)
}

// MindMaps
export function getMindMaps(): MindMap[] {
  return getData().mindMaps
}

export function getMindMap(id: string): MindMap | undefined {
  return getData().mindMaps.find(m => m.id === id)
}

export function createMindMap(mindMap: MindMap) {
  const data = getData()
  data.mindMaps.unshift(mindMap)
  saveData(data)
}

export function updateMindMap(id: string, updates: Partial<MindMap>) {
  const data = getData()
  const idx = data.mindMaps.findIndex(m => m.id === id)
  if (idx === -1) return
  data.mindMaps[idx] = { ...data.mindMaps[idx], ...updates, updatedAt: Date.now() }
  saveData(data)
}

export function deleteMindMap(id: string) {
  const data = getData()
  data.mindMaps = data.mindMaps.filter(m => m.id !== id)
  saveData(data)
}

// Contacts
export function getContacts(): Contact[] {
  return getData().contacts
}

export function getContact(id: string): Contact | undefined {
  return getData().contacts.find(c => c.id === id)
}

export function createContact(contact: Contact) {
  const data = getData()
  data.contacts.unshift(contact)
  saveData(data)
}

export function updateContact(id: string, updates: Partial<Contact>) {
  const data = getData()
  const idx = data.contacts.findIndex(c => c.id === id)
  if (idx === -1) return
  data.contacts[idx] = { ...data.contacts[idx], ...updates, updatedAt: Date.now() }
  saveData(data)
}

export function deleteContact(id: string) {
  const data = getData()
  data.contacts = data.contacts.filter(c => c.id !== id)
  saveData(data)
}

// Connections
export function getConnections(): Connection[] {
  return getData().connections
}

export function createConnection(connection: Connection) {
  const data = getData()
  data.connections.unshift(connection)
  saveData(data)
}

export function deleteConnection(id: string) {
  const data = getData()
  data.connections = data.connections.filter(c => c.id !== id)
  saveData(data)
}

export function updateConnection(id: string, updates: Partial<Connection>) {
  const data = getData()
  const idx = data.connections.findIndex(c => c.id === id)
  if (idx === -1) return
  data.connections[idx] = { ...data.connections[idx], ...updates }
  saveData(data)
}
