'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import apiClient from '@/lib/api'
import { Organization } from '@/types/api'

export function OrganizationSwitcher() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentOrgId, setCurrentOrgId] = useState<string | undefined>(
    session?.user?.organizationId
  )

  useEffect(() => {
    loadOrganizations()
  }, [])

  useEffect(() => {
    if (session?.user?.organizationId) {
      setCurrentOrgId(session.user.organizationId)
    }
  }, [session])

  const loadOrganizations = async () => {
    try {
      const orgs = await apiClient.getUserOrganizations()
      setOrganizations(orgs)
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  const handleSwitchOrganization = async (orgId: string) => {
    if (orgId === currentOrgId) return

    setIsLoading(true)
    try {
      const response = await apiClient.switchOrganization(orgId)

      // Update session with new organization context
      await update({
        ...session,
        accessToken: response.access_token,
        user: {
          ...session?.user,
          organizationId: response.organization_id,
          organizationName: response.organization_name,
          role: response.role,
        },
      })

      setCurrentOrgId(orgId)

      // Refresh the page to reload data with new org context
      router.refresh()
    } catch (error) {
      console.error('Failed to switch organization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentOrg = organizations.find((org) => org.id === currentOrgId)

  if (organizations.length <= 1) {
    // Don't show switcher if user only has one organization
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{session?.user?.organizationName}</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[200px] justify-between"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {currentOrg?.name || session?.user?.organizationName || 'Select organization'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrganization(org.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground">{org.slug}</span>
              </div>
              {org.id === currentOrgId && <Check className="h-4 w-4 ml-2" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
