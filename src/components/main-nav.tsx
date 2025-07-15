
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  ChefHat,
  User,
  UtensilsCrossed,
  Map,
  Home,
  LayoutGrid,
  Clock,
} from "lucide-react";

const mainMenuItems = [
  {
    href: "/",
    icon: Home,
    label: "Home",
  },
  {
    href: "/dishes",
    icon: UtensilsCrossed,
    label: "All Dishes",
  },
];

const cookMenuItems = [
  {
    href: "/cook/dishes",
    icon: UtensilsCrossed,
    label: "My Dishes",
  },
  {
    href: "/cook/find-clients",
    icon: Map,
    label: "Find Clients",
  },
   {
    href: "/cook/delivery-estimator",
    icon: Clock,
    label: "Delivery Estimator",
  },
  {
    href: "/cook/profile",
    icon: ChefHat,
    label: "Cook Profile",
  },
];

const userMenuItems = [
  {
    href: "/user/profile",
    icon: User,
    label: "My Profile",
  },
];


export function MainNav() {
  const pathname = usePathname();

  const isCookSection = pathname.startsWith('/cook');

  return (
    <SidebarMenu className="flex-1 p-2">
      {mainMenuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      
      <SidebarSeparator className="my-2" />

      <SidebarGroup>
         <SidebarGroupLabel className="flex items-center gap-2">
            <LayoutGrid />
            <span>Cook's Corner</span>
        </SidebarGroupLabel>
        {cookMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
                >
                <item.icon />
                <span>{item.label}</span>
                </SidebarMenuButton>
            </Link>
            </SidebarMenuItem>
        ))}
      </SidebarGroup>

      <SidebarSeparator className="my-2" />
      
      <SidebarGroup>
         <SidebarGroupLabel className="flex items-center gap-2">
            <User />
            <span>My Account</span>
        </SidebarGroupLabel>
        {userMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
                >
                <item.icon />
                <span>{item.label}</span>
                </SidebarMenuButton>
            </Link>
            </SidebarMenuItem>
        ))}
      </SidebarGroup>

    </SidebarMenu>
  );
}
