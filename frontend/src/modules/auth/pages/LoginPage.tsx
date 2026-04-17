import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/auth.store'
import { Button } from '@/shared/components/ui/Button'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate('/today', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F4F8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            background: 'linear-gradient(135deg,#ea580c,#c83800)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: 26,
            boxShadow: '0 4px 12px rgba(234,88,12,0.3)',
          }}>
            📣
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            Marketing Hub
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Nedu · space.nedu.vn · Phễu tầng 1
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.09)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          padding: 28,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
            Đăng nhập
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: 9,
                  fontSize: 13,
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="you@nedu.vn"
                onFocus={e => (e.target.style.borderColor = '#2d9b6b')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.15)')}
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: 9,
                  fontSize: 13,
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="••••••••"
                onFocus={e => (e.target.style.borderColor = '#2d9b6b')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.15)')}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 9,
                padding: '9px 12px',
                fontSize: 12,
                color: '#b91c1c',
              }}>
                ⚠️ {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Đăng nhập
            </Button>
          </form>

          <div style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 16 }}>
            Chỉ dành cho thành viên nội bộ Nedu
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 20 }}>
          © 2026 NhiLe Holdings · Nedu Marketing Hub
        </div>
      </div>
    </div>
  )
}
