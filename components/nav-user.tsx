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

export function NavUser() {
  const [open, setOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { isMobile } = useSidebar();
  const { data: session, status } = useSession();

  const userName = session?.user?.name || session?.user?.firstName + " " + session?.user?.lastName;
  const userRole = session?.user?.role;
  
  const splitUser = userName;
  const intialsChar = splitUser
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
                  <AvatarImage src={session?.user?.image || ""} alt={"avatar image"} />
                  <AvatarFallback className="rounded-lg bg-blue-500 text-black">
                    {intialsChar}
                  </AvatarFallback>
                </Avatar>
                
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {status === "loading" ? (
                    <span className="h-8 w-32 rounded bg-gray-600 animate-pulse" />
                  ) : (
                    <>
                      <span className="truncate font-semibold">{userName}</span>
                      <span className="truncate text-xs">{userRole}</span>
                    </>
                  )}
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
                    <AvatarImage src={session?.user?.image || ""} alt="user avatar" />
                    <AvatarFallback className="rounded-lg bg-blue-500 text-black">
                      {intialsChar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs">{userRole}</span>
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