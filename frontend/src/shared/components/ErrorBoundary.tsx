import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in dev; swap for a real monitoring service in prod
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            {/* Icon */}
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-bold font-headline text-gray-900 mb-2">
              Đã xảy ra lỗi
            </h2>
            <p className="text-sm text-gray-500 font-body mb-1">
              Ứng dụng gặp sự cố không mong muốn.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-2 mt-3 mb-5 text-left break-words">
                {this.state.error.message}
              </p>
            )}

            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-sm font-medium font-body bg-nedu-primary text-white rounded-lg hover:bg-nedu-primary/90 transition-colors"
              >
                Thử lại
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard' }}
                className="px-4 py-2 text-sm font-medium font-body bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
