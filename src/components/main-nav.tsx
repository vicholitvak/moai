
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
  Package,
  ListOrdered,
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
    href: "/cook/orders",
    icon: ListOrdered,
    label: "Orders",
  },
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
  {
    href: "/user/profile", // No default order, link to profile
    icon: Package,
    label: "My Orders",
  },
];


export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="flex-1 p-2">
      {mainMenuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
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
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
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
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
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
            <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href) && item.href !== '/user/profile'}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
      </SidebarGroup>

    </SidebarMenu>
  );
}
