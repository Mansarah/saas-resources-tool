
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { ChevronsUpDown, Key, LogOut } from "lucide-react";

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
import { useClientCookies } from "@/hooks/use-client-cookie";


export function NavUser() {
  const [open, setOpen] = useState(false);
 const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { isMobile } = useSidebar();
 
      const { values, isClient } = useClientCookies(['user_name','user_role'])
 
  
  

  const splitUser = values?.user_name;
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
                  {/* <AvatarImage src={user.avatar} alt={user.name} />sss */}
                  <AvatarImage src="" alt={"avatar image"} />
                  <AvatarFallback className="rounded-lg bg-blue-500 text-black">
                    {intialsChar}
                   
                  </AvatarFallback>
                </Avatar>
                
                <div className="grid flex-1 text-left text-sm leading-tight">
                   {!isClient ? (
              <span className="h-8 w-32 rounded bg-gray-600 animate-pulse" />
            ) : (
              <>
                  <span className="truncate font-semibold">{values?.user_name}</span>
                  <span className="truncate text-xs">{values?.user_role}</span>
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
                    <AvatarImage src="" alt="user.avatar" />
                    <AvatarFallback className="rounded-lg bg-blue-500 text-black">
                      {intialsChar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{values?.user_name}</span>
                    <span className="truncate text-xs">{values?.user_role}</span>
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
