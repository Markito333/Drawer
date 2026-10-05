'use client'

import { XMarkIcon } from './Icons'

interface Props {
  onClick: () => void
  title?: string
  className?: string
}

export default function CloseButton({ onClick, title = 'Cerrar', className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-6 h-6 shrink-0 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white flex items-center justify-center transition-colors ${className}`}
    >
      <XMarkIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
    </button>
  )
}
