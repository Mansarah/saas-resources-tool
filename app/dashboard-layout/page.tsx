/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { AppBottombar } from "@/components/app-bottombar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {  Key, LogOut } from "lucide-react";


import { useState } from "react";
import { Breadcrumbs } from "@/components/new/breadcrumbs";
import { useRouter } from "next/navigation";
import ThemeToggler from "@/components/layout/header/ThemeToggle";





export default function Page({ children }: { children?: React.ReactNode }) {
   const router = useRouter();
  const [open, setOpen] = useState(false);

  

  const handleBackClick = () => {
    router.back(); // ✅ No event needed
  };

 
  return (
    <SidebarProvider>
      {/* Desktop/Tablet Layout - Show sidebar normally */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      <SidebarInset>
        {/* Header that appears on all screens */}
        {/* <header className="hidden sm:flex flex-row justify-between h-16 shrink-0   items-center gap-2 transition-[width,height] ease-linear"> */}
           <header className="hidden sm:sticky  top-0 z-10 sm:flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2 px-4">

            <SidebarTrigger className="-ml-1 hover:bg-blue-100" />
            <Separator orientation="vertical" className="mr-2 h-4 inline-block" />



            {/* Breadcrumb visible on all screens */}
            {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    onClick={handleBackClick}
                    className="flex items-center gap-2 text-muted-foreground hover:text-yellow-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
               <Breadcrumbs onBack={handleBackClick} />
          </div>
             {/* <ThemeToggler/> */}
        </header>
     





        {/* Mobile header text - only shown on sm screens */}

        <div className="sm:hidden sticky top-0 flex justify-between items-center px-4 py-2  border-b z-40 bg-white  rounded-b-lg shadow-sm">
          <div className="font-semibold flex items-center space-x-2">
            {/* <img src={logo} alt="logo"  className="h-8 w-full" /> */}
            <span>JAJU-CRM</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center relative">
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                <Avatar className="h-8 w-8 border-2 border-blue-300 rounded-lg shadow-sm">
                  <AvatarImage src="/avatars/shadcn.jpg" alt={"initialsChar"} />
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-black font-bold text-xs">
                    L
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl border border-blue-200 shadow-lg" side="bottom" align="end" sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 p-3 text-left text-sm bg-blue-50 rounded-t-xl">
                  <Avatar className="h-10 w-10 rounded-full border-2 border-blue-300">
                    <AvatarImage src="/avatars/shadcn.jpg" alt="initialsChar" />
                    <AvatarFallback className="rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-black font-bold">
                      L
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-blue-900">{"Sajid"}</span>
                    <span className="truncate text-xs text-blue-700">{"s.khan9430319425@gmail.com"}</span>
                    <span className="text-xs text-green-600 font-medium mt-0.5 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                      Online
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-blue-200" />
              <DropdownMenuItem className="hover:bg-blue-100 focus:bg-blue-100 rounded-md my-0.5 mx-1" onClick={() => setOpen(true)}>
                <Key className="mr-2 h-4 w-4 text-blue-700" />
                <span className="cursor-pointer">Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-blue-100 focus:bg-blue-100 rounded-md my-0.5 mx-1" >
                <LogOut className="mr-2 h-4 w-4 text-blue-700" />
                <span className="cursor-pointer">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>










        {/* Main content area - adjusted for mobile bottom nav */}
        <div className="flex flex-1 flex-col gap-4 p-0 md:p-4 pt-0">
          <div className="min-h-[calc(100vh-8rem)] md:min-h-[100vh] flex-1 rounded-xl p-2 pb-16  md:pb-2">
            {children}
          </div>
        </div>

        {/* Mobile bottom navigation */}
        <div className="sm:hidden ">
          <AppBottombar />
        </div>
        {/* <ChangePassword setOpen={setOpen} open={open} /> */}
      </SidebarInset>
    </SidebarProvider>
  );
}