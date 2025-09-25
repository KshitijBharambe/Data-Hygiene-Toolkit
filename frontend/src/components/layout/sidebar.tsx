'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Database,
  Shield,
  Play,
  AlertTriangle,
  FileText,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  Home,
  Upload,
  FileSpreadsheet,
  CheckSquare,
  Activity,
  Download,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { useDashboardOverview } from '@/lib/hooks/useDashboard'
import { DashboardOverview } from '@/types/api'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavItem[]
  roles?: string[]
}

function getNavigationItems(dashboardData: DashboardOverview | undefined): NavItem[] {
  return [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      title: 'Data Management',
      icon: Database,
      children: [
        {
          title: 'Upload Data',
          href: '/data/upload',
          icon: Upload,
        },
        {
          title: 'Datasets',
          href: '/data/datasets',
          icon: FileSpreadsheet,
          badge: dashboardData?.overview.total_datasets?.toString(),
        },
        {
          title: 'Data Profile',
          href: '/data/profile',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Quality Rules',
      icon: Shield,
      children: [
        {
          title: 'All Rules',
          href: '/rules',
          icon: CheckSquare,
        },
        {
          title: 'Create Rule',
          href: '/rules/create',
          icon: Settings,
        },
      ],
    },
    {
      title: 'Execution',
      icon: Activity,
      children: [
        {
          title: 'Run Rules',
          href: '/executions/create',
          icon: Play,
        },
        {
          title: 'All Executions',
          href: '/executions',
          icon: Activity,
          badge: dashboardData?.overview.total_executions?.toString(),
        },
      ],
    },
    {
      title: 'Issues',
      href: '/issues',
      icon: AlertTriangle,
      badge: dashboardData ? (dashboardData.overview.total_issues - dashboardData.overview.total_fixes)?.toString() : undefined,
    },
    {
      title: 'Reports',
      icon: FileText,
      children: [
        {
          title: 'Quality Reports',
          href: '/reports/quality',
          icon: BarChart3,
        },
        {
          title: 'Export Data',
          href: '/reports/export',
          icon: Download,
        },
      ],
    },
    {
      title: 'Administration',
      icon: Settings,
      roles: ['admin'],
      children: [
        {
          title: 'Users',
          href: '/admin/users',
          icon: Users,
          roles: ['admin'],
        },
        {
          title: 'System Settings',
          href: '/admin/settings',
          icon: Settings,
          roles: ['admin'],
        },
      ],
    },
  ]
}

function NavItemComponent({
  item,
  level = 0,
  isExpanded = false,
  onToggleExpanded
}: {
  item: NavItem;
  level?: number;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = item.href === pathname
  const hasActiveChild = item.children?.some(child =>
    child.href === pathname ||
    (child.children && child.children.some(grandchild => grandchild.href === pathname))
  )

  // Check if user has permission to see this item - after hooks
  if (item.roles && !item.roles.includes(session?.user?.role || '')) {
    return null
  }

  // For items with children, use the expanded state from parent
  // For items without children, expand if they have active children
  const shouldBeExpanded = item.children ? isExpanded || hasActiveChild : false

  const handleClick = () => {
    if (item.children && onToggleExpanded) {
      onToggleExpanded()
    }
  }

  const itemContent = (
    <div className={cn(
      'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
      level > 0 && 'ml-4',
      isActive && 'bg-primary text-primary-foreground',
      !isActive && 'hover:bg-muted',
      hasActiveChild && !isActive && 'bg-muted/50'
    )}>
      <item.icon className="h-4 w-4" />
      <span className="flex-1 text-sm font-medium">{item.title}</span>
      {item.badge && (
        <Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
          {item.badge}
        </Badge>
      )}
      {item.children && (
        <div className="ml-auto">
          {shouldBeExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      )}
    </div>
  )

  return (
    <div>
      {item.href ? (
        <Link href={item.href} onClick={handleClick}>
          {itemContent}
        </Link>
      ) : (
        <button onClick={handleClick} className="w-full text-left">
          {itemContent}
        </button>
      )}

      {item.children && shouldBeExpanded && (
        <div className="mt-1 space-y-1">
          {item.children.map((child, index) => (
            <NavItemComponent
              key={index}
              item={child}
              level={level + 1}
              isExpanded={false}
              onToggleExpanded={undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: dashboardData } = useDashboardOverview()
  const navigationItems = getNavigationItems(dashboardData)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Initialize expanded states from localStorage
  useEffect(() => {
    const savedStates = localStorage.getItem('sidebar-expanded-items')
    if (savedStates) {
      setExpandedItems(JSON.parse(savedStates))
    }
    setMounted(true)
  }, [])

  // Auto-expand items with active children
  useEffect(() => {
    if (mounted && navigationItems) {
      setExpandedItems(prev => {
        const newExpandedItems = { ...prev }
        let hasChanges = false

        navigationItems.forEach(item => {
          if (item.children) {
            const hasActiveChild = item.children.some(child =>
              child.href === pathname ||
              (child.children && child.children.some(grandchild => grandchild.href === pathname))
            )

            if (hasActiveChild && !newExpandedItems[item.title]) {
              newExpandedItems[item.title] = true
              hasChanges = true
            }
          }
        })

        return hasChanges ? newExpandedItems : prev
      })
    }
  }, [pathname, mounted, navigationItems])

  // Persist expanded states to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-expanded-items', JSON.stringify(expandedItems))
    }
  }, [expandedItems, mounted])

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }))
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        // Base: fixed sidebar that slides in/out
        'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-background border-r transition-transform duration-200 ease-in-out',
        // State: show/hide based on isOpen prop
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 border-b md:hidden">
            <span className="font-semibold">Navigation</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <nav className="space-y-2">
              {navigationItems.map((item, index) => (
                <NavItemComponent
                  key={index}
                  item={item}
                  isExpanded={expandedItems[item.title] || false}
                  onToggleExpanded={() => toggleExpanded(item.title)}
                />
              ))}
            </nav>
          </div>

          {/* Quick stats */}
          <div className="border-t p-4">
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quick Stats
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Datasets</span>
                  <Badge variant="outline">
                    {dashboardData?.overview.total_datasets || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Open Issues</span>
                  <Badge variant="destructive">
                    {dashboardData
                      ? dashboardData.overview.total_issues - dashboardData.overview.total_fixes
                      : 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total Executions</span>
                  <Badge variant="outline">
                    {dashboardData?.overview.total_executions || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}