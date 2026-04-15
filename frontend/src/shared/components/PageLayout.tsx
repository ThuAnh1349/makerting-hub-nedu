import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface PageLayoutProps {
  title: string
  children?: ReactNode
  actions?: ReactNode
}

export function PageLayout({ title, children, actions }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Page header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-headline text-nedu-primary">
              {title}
            </h1>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  )
}
