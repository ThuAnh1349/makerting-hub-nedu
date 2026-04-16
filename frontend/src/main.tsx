import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import { queryClient } from './shared/config/query-client'
import { ToastProvider } from './shared/components/ui/Toast'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import './index.css'

const USE_MOCKS =
  import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS === 'true'

async function prepare() {
  if (USE_MOCKS) {
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: { url: '/mockServiceWorker.js' },
      })
    } catch (e) {
      console.warn('[MSW] Service worker not available, skipping mocks:', e)
    }
  }
}

prepare().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ToastProvider>
              <App />
            </ToastProvider>
          </BrowserRouter>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
})
