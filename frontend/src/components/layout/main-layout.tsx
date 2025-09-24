'use client'

import { useState, useEffect } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  // Initialize sidebar state from localStorage after mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-open')
    let initialState: boolean

    if (savedState !== null) {
      initialState = JSON.parse(savedState)
    } else {
      // Default to open on desktop, closed on mobile
      initialState = window.innerWidth >= 768
    }

    setSidebarOpen(initialState)
    setMounted(true)
  }, [])

  // Persist sidebar state to localStorage whenever it changes (but not on initial mount)
  useEffect(() => {
    if (mounted && sidebarOpen !== null) {
      localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen))
    }
  }, [sidebarOpen, mounted])

  // Don't render until state is initialized to prevent flicker
  if (sidebarOpen === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => {}} />
        <div className="flex">
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    )
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={toggleSidebar} />
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className={cn(
          "flex-1 p-6 transition-all duration-200",
          sidebarOpen ? "ml-0 md:ml-64" : "ml-0"
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}