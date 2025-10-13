
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
 
              <SidebarMenuButton
                size="lg"
    className="  data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                                   <AvatarImage src={user.image || ""} alt="avatar image" />
                  <AvatarFallback className="rounded-lg bg-[var(--team-color)] text-black">
                {initialsChar}
                  </AvatarFallback>
                </Avatar>
                
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold ">{user.name}</span>
                  <span className="truncate text-xs">{user.role}</span>
                </div>
              <LogOut
                onClick={() => setShowSignOutDialog(true)}
              
                className="ml-auto size-4  hover:text-red-600 hover:scale-125 "  />
             
              </SidebarMenuButton>
        
         
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