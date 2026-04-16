import { ReactNode, useEffect } from 'react'

type ModalSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<ModalSize, number> = {
  sm: 440,
  md: 560,
  lg: 720,
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: ModalSize
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div style={{
        position: 'relative',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: sizeMap[size],
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.15s ease-out',
      }}>
        {/* Header */}
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.09)',
            flexShrink: 0,
          }}>
            <div id="modal-title" style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
              {title}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: 18,
                padding: 4,
                borderRadius: 6,
                lineHeight: 1,
              }}
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
