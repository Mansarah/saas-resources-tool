import * as React from "react";
import {
  AudioWaveform,
  
  Command,

  GalleryVerticalEnd,
    Frame,
    ShoppingBag,
    Package,
    TicketPlus,  
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";



export   function AppSidebar({ ...props }) {
  
  const initialData = {
   
    navMain: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: Frame,
        isActive: false,
      },
      {
        title: "E-Dashboard",
        url: "/employee",
        icon: Frame,
        isActive: false,
      },
      {
        title: "Calender",
        url: "/admin/calender",
        icon: Frame,
        isActive: false,
      },
      {
        title: "E-Calender",
        url: "/employee/calender",
        icon: Frame,
        isActive: false,
      },
      {
        title: "E-Requests",
        url: "/employee/new-request",
        icon: Frame,
        isActive: false,
      },
     
     
      {
        title: "E-Requests List",
        url: "/employee/my-requests",
        icon: Frame,
        isActive: false,
      },
     
     
      {
        title: "Time Off Requests",
        url: "/admin/time-off-requests",
        icon: ShoppingBag,
        isActive: false,
      },
      
       {
        title: "Company Settings",
        url: "#",
        icon: TicketPlus,
        isActive: false,
        items: [
          {
            title: "Profile",
            url: "/admin/company-settings/profile",
          },
          {
            title: "Holidays",
            url: "/admin/company-settings/holidays",
          },
          {
            title: "Working Days",
            url: "/admin/company-settings/working-days",
          },
         
        ],
      },
      {
        title: "Team management",
        url: "/admin/employees",
        icon: Package,
        isActive: false,
      },
      {
        title: "Report",
        url: "/admin/report",
        icon: Package,
        isActive: false,
      },
      {
        title: "Integration",
        url: "/admin/integration",
        icon: Package,
        isActive: false,
      },
    
     
    ],
  };
  // const initialData = {
  //   user: {
  //     name: `${nameL}`,
  //     email: `${emailL}`,
  //     avatar: "/avatars/shadcn.jpg",
  //   },
  //   teams: [
  //     {
  //       name: `Jaju Flooring`,
  //       logo: GalleryVerticalEnd,
  //       plan: "",
  //     },
  //     {
  //       name: "Acme Corp.",
  //       logo: AudioWaveform,
  //       plan: "Startup",
  //     },
  //     {
  //       name: "Evil Corp.",
  //       logo: Command,
  //       plan: "Free",
  //     },
  //   ],
  //   navMain: [
  //     {
  //       title: "Dashboard",
  //       url: "/home",
  //       icon: LayoutDashboard,
  //       isActive: false,
  //     },
     
  //     {
  //       title: "Estimate",
  //       url: "/estimate",
  //       icon: FileText,
  //       isActive: false,
  //     },
  //     {
  //       title: "Day Book",
  //       url: "/day-book",
  //       icon: BookOpen,
  //       isActive: false,
  //     },
  //     {
  //       title: "Ledger",
  //       url: "/ledger",
  //       icon: Book,
  //       isActive: false,
  //     },
  //     {
  //       title: "Trial Balance",
  //       url: "/trial-balance",
  //       icon: Scale,
  //       isActive: false,
  //     },
  //     {
  //       title: "Product",
  //       url: "/product",
  //       icon: Box,
  //       isActive: false,
  //     },
  //     {
  //       title: "Purchase Granite",
  //       url: "/purchase-granite",
  //       icon: Mountain,
  //       isActive: false,
  //     },
  //     {
  //       title: "Purchase Tiles",
  //       url: "/purchase-tiles",
  //       icon: SquareStack,
  //       isActive: false,
  //     },
  //     {
  //       title: "Sales",
  //       url: "/sales",
  //       icon: ShoppingCart,
  //       isActive: false,
  //     },
  //     {
  //       title: "Stocks",
  //       url: "/stocks",
  //       icon: Warehouse,
  //       isActive: false,
  //     },
     
  //   ],
  // };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher  />
      </SidebarHeader>
      <SidebarContent className="sidebar-content">
        {/* <NavProjects projects={data.projects} /> */}
        <NavMain items={initialData.navMain} />
        {/* <NavMainUser projects={initialData.userManagement} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}


//changes 