
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link as ViewTransitionsLink } from "next-view-transitions";
import { usePathname } from "next/navigation";
import React from "react";
import { useSession } from "next-auth/react";
import moment from "moment";

const itemVariants = {
  open: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
  closed: { opacity: 0, height: 0, transition: { duration: 0.3 } },
};

const buttonVariants = {
  hover: { scale: 1.05 },
};

// helper to convert "shopping-bag" → "ShoppingBag"
function toPascalCase(str: string) {
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function NavMain({ items }: { items: any[] }) {
  const pathname = usePathname();
    const { data: session } = useSession();

  // Save sidebar scroll position before navigating
  const handleLinkClick = () => {
    const sidebarContent = document.querySelector(".sidebar-content");
    if (sidebarContent) {
      sessionStorage.setItem(
        "sidebarScrollPosition",
        sidebarContent.scrollTop.toString()
      );
    }
  };

  // Restore scroll position after navigation
  React.useEffect(() => {
    const sidebarContent = document.querySelector(".sidebar-content");
    const scrollPosition = sessionStorage.getItem("sidebarScrollPosition");

    if (sidebarContent && scrollPosition) {
      sidebarContent.scrollTop = parseInt(scrollPosition, 10);
    }
  }, [pathname]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <>
    <SidebarGroup>
      <SidebarGroupLabel>Home</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;

          const isParentActive = hasSubItems
            ? item.items.some((subItem: any) => subItem.url === pathname)
            : pathname === item.url;

        
          const Icon =
            (item.icon && (Icons as any)[toPascalCase(item.icon)]) ||
            Icons.Circle;

          if (!hasSubItems) {
            return (
             <SidebarMenuItem key={item.title}>
                <ViewTransitionsLink href={item.url} onClick={handleLinkClick}>
                  <motion.div variants={buttonVariants} whileHover="hover">
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={`rounded-md transition-colors duration-200 ${
                        isParentActive
                          ? "bg-[var(--color-light)] text-[var(--color)] dark:bg-[var(--color-dark)] dark:text-[var(--color-dark-text)]"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </motion.div>
                </ViewTransitionsLink>
              </SidebarMenuItem>
            );
          }

          return (
             <Collapsible
              key={item.title}
              asChild
              defaultOpen={true}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <motion.div variants={buttonVariants} whileHover="hover">
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={`rounded-md transition-colors duration-200 ${
                        isParentActive
                          ? "bg-[var(--color-light)] text-[var(--color)] dark:bg-[var(--color-dark)] dark:text-[var(--color-dark-text)]"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </motion.div>
                </CollapsibleTrigger>

                {/* <CollapsibleContent
                  as={motion.div}
                  variants={itemVariants}
                  initial="closed"
                  animate={isParentActive ? "open" : "closed"}
                >
                  <SidebarMenuSub className="border-l border-blue-500">
                    {item.items?.map((subItem: any) => {
                      const isSubItemActive = pathname === subItem.url;
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <ViewTransitionsLink href={subItem.url} onClick={handleLinkClick}>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`px-3 py-2 rounded-md transition-colors duration-200 ${
                                  isSubItemActive
                                    ? "bg-[var(--color-light)] text-[var(--color)] w-full rounded-xl dark:bg-[var(--color-dark)] dark:text-[var(--color-dark-text)]"
                                    : ""
                                }`}
                              >
                                {subItem.title}
                              </motion.div>
                            </ViewTransitionsLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent> */}
                <CollapsibleContent>
  <motion.div
    variants={itemVariants}
    initial="closed"
    animate={isParentActive ? "open" : "closed"}
  >
    <SidebarMenuSub className="border-l border-blue-500">
      {item.items?.map((subItem: any) => {
        const isSubItemActive = pathname === subItem.url;
        return (
          <SidebarMenuSubItem key={subItem.title}>
            <SidebarMenuSubButton asChild>
              <ViewTransitionsLink
                href={subItem.url}
                onClick={handleLinkClick}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`px-3 py-2 rounded-md transition-colors duration-200 ${
                    isSubItemActive
                      ? "bg-[var(--color-light)] text-[var(--color)] w-full rounded-xl dark:bg-[var(--color-dark)] dark:text-[var(--color-dark-text)]"
                      : ""
                  }`}
                >
                  {subItem.title}
                </motion.div>
              </ViewTransitionsLink>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        );
      })}
    </SidebarMenuSub>
  </motion.div>
</CollapsibleContent>

              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>

{session?.user?.role === "ADMIN" && 
 (session?.user?.subscriptionStatus !== "ACTIVE" || 
  moment().isAfter(moment(session?.user?.stripeCurrentPeriodEnd))) && (
<div className="mt-auto p-3">
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-4 shadow-lg"
  >
    {/* Sparkle icon */}
    <Icons.Zap className="absolute top-2 right-2 h-3 w-3 text-yellow-300" />
    
    {/* Content */}
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white text-sm">
          Upgrade to Pro
        </h3>
        <Icons.Crown className="h-3 w-3 text-yellow-300" />
      </div>
      
      <p className="text-white/80 text-xs mb-3 leading-tight">
        Unlock premium features
      </p>
      
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <ViewTransitionsLink href="/admin/upgrade" onClick={handleLinkClick}>
          <button className="w-full bg-white text-indigo-600 font-medium text-xs py-1.5 px-3 rounded-md hover:bg-gray-50 transition-all duration-200 shadow-sm">
            Upgrade
          </button>
        </ViewTransitionsLink>
      </motion.div>
    </div>

    {/* Subtle shine effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full animate-shine" />
  </motion.div>
</div>
)}
</>
  );
}