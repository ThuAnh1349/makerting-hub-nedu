import { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className,
  style,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Roboto, system-ui, sans-serif',
    fontWeight: 700,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    border: 'none',
    transition: 'opacity 0.15s, box-shadow 0.15s',
    gap: 6,
    whiteSpace: 'nowrap',
  }

  const variantStyle: React.CSSProperties = (() => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg,#2d9b6b,#22c575)',
          color: '#fff',
          boxShadow: '0 1px 4px rgba(45,155,107,0.3)',
        }
      case 'secondary':
        return {
          background: 'rgba(45,155,107,0.08)',
          color: '#1a5c46',
          border: '1px solid rgba(45,155,107,0.3)',
        }
      case 'outline':
        return {
          background: '#fff',
          color: '#374151',
          border: '1px solid rgba(0,0,0,0.15)',
        }
      case 'ghost':
        return {
          background: 'transparent',
          color: '#6b7280',
        }
      case 'danger':
        return {
          background: 'linear-gradient(135deg,#ef4444,#dc2626)',
          color: '#fff',
        }
      default:
        return {}
    }
  })()

  const sizeStyle: React.CSSProperties = (() => {
    switch (size) {
      case 'sm':  return { padding: '5px 10px', fontSize: 11, borderRadius: 7 }
      case 'md':  return { padding: '7px 14px', fontSize: 12, borderRadius: 8 }
      case 'lg':  return { padding: '9px 18px', fontSize: 13, borderRadius: 9 }
      default:    return { padding: '7px 14px', fontSize: 12, borderRadius: 8 }
    }
  })()

  return (
    <button
      disabled={disabled || isLoading}
      style={{ ...baseStyle, ...variantStyle, ...sizeStyle, ...style }}
      className={clsx(className)}
      {...props}
    >
      {isLoading && (
        <svg
          style={{ width: 14, height: 14, flexShrink: 0 }}
          className="animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
