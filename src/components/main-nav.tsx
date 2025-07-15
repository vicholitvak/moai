
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
  Bike,
  PieChart,
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
    href: "/cook/earnings",
    icon: PieChart,
    label: "Earnings",
  },
  {
    href: "/cook/profile",
    icon: ChefHat,
    label: "Cook Profile",
  },
];

const driverMenuItems = [
  {
    href: "/driver/deliveries",
    icon: Map,
    label: "Find Deliveries",
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

  return (
    <SidebarMenu className="flex-1 p-2">
      {mainMenuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <span>
                <item.icon />
                <span>{item.label}</span>
              </span>
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
            <Link href={item.href}>
                <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                >
                <span>
                  <item.icon />
                  <span>{item.label}</span>
                </span>
                </SidebarMenuButton>
            </Link>
            </SidebarMenuItem>
        ))}
      </SidebarGroup>
      
      <SidebarSeparator className="my-2" />

      <SidebarGroup>
         <SidebarGroupLabel className="flex items-center gap-2">
            <Bike />
            <span>Driver's Hub</span>
        </SidebarGroupLabel>
        {driverMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
            <Link href={item.href}>
                <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                >
                <span>
                  <item.icon />
                  <span>{item.label}</span>
                </span>
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
            <Link href={item.href}>
                <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                >
                <span>
                  <item.icon />
                  <span>{item.label}</span>
                </span>
                </SidebarMenuButton>
            </Link>
            </SidebarMenuItem>
        ))}
      </SidebarGroup>

    </SidebarMenu>
  );
}
