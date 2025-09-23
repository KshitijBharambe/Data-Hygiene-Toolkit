'use client'

import { useState } from 'react'
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
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  title: string
  href?: string
  icon: any
  badge?: string | number
  children?: NavItem[]
  roles?: string[]
}

const navigationItems: NavItem[] = [
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
        badge: '12',
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
        badge: '24',
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
    icon: Play,
    children: [
      {
        title: 'Run Checks',
        href: '/execution/run',
        icon: Play,
      },
      {
        title: 'Execution History',
        href: '/execution/history',
        icon: Activity,
        badge: '8',
      },
    ],
  },
  {
    title: 'Issues',
    href: '/issues',
    icon: AlertTriangle,
    badge: '15',
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

function NavItemComponent({ item, level = 0 }: { item: NavItem; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  // Check if user has permission to see this item
  if (item.roles && !item.roles.includes(session?.user?.role || '')) {
    return null
  }

  const isActive = item.href === pathname
  const hasActiveChild = item.children?.some(child =>
    child.href === pathname ||
    (child.children && child.children.some(grandchild => grandchild.href === pathname))
  )

  const handleClick = () => {
    if (item.children) {
      setIsExpanded(!isExpanded)
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
          {isExpanded ? (
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

      {item.children && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children.map((child, index) => (
            <NavItemComponent key={index} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
        'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 transform bg-background border-r transition-transform duration-200 ease-in-out md:relative md:top-0 md:h-[calc(100vh-4rem)] md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <nav className="space-y-2">
              {navigationItems.map((item, index) => (
                <NavItemComponent key={index} item={item} />
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
                  <span>Active Datasets</span>
                  <Badge variant="outline">12</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Open Issues</span>
                  <Badge variant="destructive">15</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Last Execution</span>
                  <span className="text-xs text-muted-foreground">2h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}