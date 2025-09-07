import * as React from "react"
import { ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthSession } from "@/hooks/useAuthSession"
import { useRouter } from "next/navigation"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { session, loading, isAuthenticated } = useAuthSession()
  const router = useRouter()

  if (!loading && !isAuthenticated) {
    router.push("/auth/signin")
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-500 text-black">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            {loading ? (
              <span className="h-4 w-32 rounded bg-gray-600 animate-pulse" />
            ) : (
              <span className="truncate font-semibold">
                {session?.user.companyName}
              </span>
            )}
            <span className="truncate text-xs">LeaveFlow CRM</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
