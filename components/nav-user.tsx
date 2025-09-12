/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { ChevronsUpDown, Key, LogOut } from "lucide-react";
import { useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
// import ChangePassword from "@/app/auth/ChangePassword";
import { useState } from "react";

import { SignOutDialog } from "./auth/sigin-out-button";

export function NavUser({
  user,
}: {
  user: { name: string; role: string; image: string | null };
}) {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { isMobile } = useSidebar();

  const splitUser = user.name;
  const initialsChar = splitUser
    ?.split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                                   <AvatarImage src={user.image || ""} alt="avatar image" />
                  <AvatarFallback className="rounded-lg bg-blue-500 text-black">
                {initialsChar}
                  </AvatarFallback>
                </Avatar>
                
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.role}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.image || ""} alt="user avatar" />
                    <AvatarFallback className="rounded-lg bg-blue-500 text-black">
                      {initialsChar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.role}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              {/* <DropdownMenuItem onClick={() => setOpen(true)}>
                <Key />
                <span className=" cursor-pointer">Change Password</span>
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => setShowSignOutDialog(true)}>
                <LogOut />
                <span className="cursor-pointer">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
       
      <SignOutDialog 
        open={showSignOutDialog} 
        onOpenChange={setShowSignOutDialog} 
      />
      {/* <ChangePassword setOpen={setOpen} open={open} /> */}
    </>
  );
}