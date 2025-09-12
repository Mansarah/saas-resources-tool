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
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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
                <Link href={item.url} onClick={handleLinkClick}>
                  <motion.div variants={buttonVariants} whileHover="hover">
                    <SidebarMenuButton tooltip={item.title}>
                      <Icon className="h-4 w-4" />
                      <span
                        className={`transition-colors duration-200 ${
                          isParentActive
                            ? "text-blue-500"
                            : "hover:text-blue-500"
                        }`}
                      >
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </motion.div>
                </Link>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isParentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <motion.div variants={buttonVariants} whileHover="hover">
                    <SidebarMenuButton tooltip={item.title}>
                      <Icon className="h-4 w-4" />
                      <span
                        className={`transition-colors duration-200 ${
                          isParentActive
                            ? "text-blue-500"
                            : "hover:text-blue-500"
                        }`}
                      >
                        {item.title}
                      </span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </motion.div>
                </CollapsibleTrigger>

                <CollapsibleContent
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
                            <Link href={subItem.url} onClick={handleLinkClick}>
                              <motion.span
                                className={`transition-colors duration-200 ${
                                  isSubItemActive
                                    ? "text-blue-500 "
                                    : "hover:text-blue-500"
                                }`}
                                whileHover={{ scale: 1.05 }}
                              >
                                {subItem.title}
                              </motion.span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
