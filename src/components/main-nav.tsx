"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  User,
  UtensilsCrossed,
  Map,
  Truck,
  CreditCard,
  Cog,
  Home,
} from "lucide-react";

const menuItems = [
  {
    href: "/",
    icon: Home,
    label: "Home",
    tooltip: "Home",
  },
  {
    href: "/dishes",
    icon: UtensilsCrossed,
    label: "All Dishes",
    tooltip: "All Dishes"
  },
  {
    href: "/cook/profile",
    icon: ChefHat,
    label: "Cook Dashboard",
    tooltip: "Cook Dashboard",
  },
  {
    href: "/user/profile",
    icon: User,
    label: "My Profile",
    tooltip: "My Profile",
  },
];

const cookMenuItems = [
    {
        href: "/cook/dishes",
        icon: UtensilsCrossed,
        label: "My Dishes",
        tooltip: "My Dishes",
    },
    {
        href: "/cook/find-clients",
        icon: Map,
        label: "Find Clients",
        tooltip: "Find Clients",
    },
    {
        href: "/cook/profile",
        icon: Cog,
        label: "Cook Settings",
        tooltip: "Settings"
    }
]

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="p-2 flex-1">
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === item.href}
              tooltip={item.tooltip}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
