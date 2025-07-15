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
} from "lucide-react";

const menuItems = [
  {
    href: "/",
    icon: Truck,
    label: "Delivery Estimator",
    tooltip: "AI Delivery Estimator",
  },
  {
    href: "/cook/profile",
    icon: ChefHat,
    label: "Cook Profile",
    tooltip: "Cook Profile",
  },
  {
    href: "/user/profile",
    icon: User,
    label: "User Profile",
    tooltip: "User Profile",
  },
  {
    href: "/cook/dishes",
    icon: UtensilsCrossed,
    label: "Dish Listings",
    tooltip: "Dish Listings",
  },
  {
    href: "/cook/find-clients",
    icon: Map,
    label: "Find Clients",
    tooltip: "Find Clients",
  },
];

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
