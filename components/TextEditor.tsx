'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { linkifyHTML } from '@/lib/links'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export default function TextEditor({ value, onChange, placeholder, minHeight = '120px' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)
  const isInternal = useRef(false)
  const [showTextColor, setShowTextColor] = useState(false)

  const TEXT_COLORS = [
    { label: 'Rojo', value: '#ef4444' },
    { label: 'Naranja', value: '#f97316' },
    { label: 'Verde', value: '#22c55e' },
    { label: 'Azul', value: '#3b82f6' },
    { label: 'Morado', value: '#a855f7' },
    { label: 'Rosa', value: '#ec4899' },
    { label: 'Gris', value: '#6b7280' },
    { label: 'Negro', value: '#18181b' },
  ]

  useEffect(() => {
    const el = ref.current
    if (!el || isInternal.current) {
      isInternal.current = false
      return
    }
    if (el.innerHTML === value) return

    const sel = window.getSelection()
    let savedOffset = 0
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0)
      const pre = document.createRange()
      pre.selectNodeContents(el)
      pre.setEnd(range.startContainer, range.startOffset)
      savedOffset = pre.toString().length
    }

    el.innerHTML = linkifyHTML(value)

    if (savedOffset > 0) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
      let charCount = 0
      let node: Text | null
      while (node = walker.nextNode() as Text | null) {
        const len = node.textContent?.length ?? 0
        if (charCount + len >= savedOffset) {
          const r = document.createRange()
          r.setStart(node, Math.min(savedOffset - charCount, len))
          r.collapse(true)
          sel?.removeAllRanges()
          sel?.addRange(r)
          break
        }
        charCount += len
      }
    }
  }, [value])

  const handleInput = () => {
    if (ref.current) {
      const html = ref.current.innerHTML
      if (html !== value) {
        isInternal.current = true
        onChange(html)
      }
    }
  }

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setShowToolbar(false)
      return
    }

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setToolbarPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    })
    setShowToolbar(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node) &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setShowToolbar(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const toggleHighlight = () => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const node = range.commonAncestorContainer

    const findHighlightSpan = (n: Node | null): HTMLElement | null => {
      while (n) {
        if (n.nodeType === 1) {
          const el = n as HTMLElement
          const bg = el.style.backgroundColor
          if (bg === 'yellow' || bg === '#fde047' || bg === 'rgb(253, 224, 71)') return el
        }
        n = n.parentNode
      }
      return null
    }

    const span = findHighlightSpan(node)
    if (span) {
      span.style.backgroundColor = 'transparent'
      if (span.textContent?.trim() === '' && span.innerHTML === '') span.remove()
    } else {
      document.execCommand('hiliteColor', false, '#fde047')
    }
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'A') {
      const anchor = target as HTMLAnchorElement
      if (anchor.href) {
        e.preventDefault()
        e.stopPropagation()
        window.open(anchor.href, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onMouseUp={handleMouseUp}
        onKeyUp={handleMouseUp}
        onClick={handleClick}
        style={{ minHeight }}
        className="w-full text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400 leading-relaxed [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-zinc-400 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-zinc-900 dark:[&_h1]:text-zinc-100 [&_h1]:my-2"
        data-placeholder={placeholder}
      />
      {showToolbar && (
        <div
          ref={toolbarRef}
          className="fixed z-50 flex items-center gap-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg px-1.5 py-1"
          style={{
            top: toolbarPos.top,
            left: toolbarPos.left,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button
            onClick={() => exec('bold')}
            className="w-7 h-7 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Negrita"
          >
            B
          </button>
          <button
            onClick={() => exec('italic')}
            className="w-7 h-7 flex items-center justify-center text-sm italic text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Cursiva"
          >
            I
          </button>
          <button
            onClick={() => exec('underline')}
            className="w-7 h-7 flex items-center justify-center text-sm underline text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Subrayar"
          >
            U
          </button>
          <button
            onClick={toggleHighlight}
            className="w-7 h-7 flex items-center justify-center text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Resaltar"
          >
            <span className="bg-yellow-300 px-1 rounded text-[10px] font-medium">A</span>
          </button>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
          <button
            onClick={() => exec('formatBlock', 'h1')}
            className="w-7 h-7 flex items-center justify-center text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Título grande (H1)"
          >
            H1
          </button>
          <div className="relative">
            <button
              onClick={() => setShowTextColor(!showTextColor)}
              className="w-7 h-7 flex items-center justify-center text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
              title="Color de texto"
            >
              <span className="text-xs font-bold" style={{ textDecoration: 'underline', textDecorationColor: '#3b82f6', textUnderlineOffset: '2px' }}>A</span>
            </button>
            {showTextColor && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex items-center gap-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg px-1.5 py-1">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => { exec('foreColor', c.value); setShowTextColor(false) }}
                    className="w-5 h-5 rounded-full hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
          <button
            onClick={() => {
              const sel = window.getSelection()
              if (sel) navigator.clipboard.writeText(sel.toString())
              setShowToolbar(false)
            }}
            className="w-7 h-7 flex items-center justify-center text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Copiar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
          </button>
        </div>
      )}
      {showTextColor && (
        <div className="fixed inset-0 z-40" onClick={() => setShowTextColor(false)} />
      )}
    </div>
  )
}
