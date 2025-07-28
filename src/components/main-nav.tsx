
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserProfile } from "@/context/AuthContext";
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

interface NavLink {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: Array<UserProfile['role'] | 'public' | 'anonymous'>; // 'public' for all, 'anonymous' for logged-out
  group?: 'main' | 'cook' | 'driver' | 'user';
}

const allNavLinks: NavLink[] = [
  {
    href: "/",
    icon: Home,
    label: "Home",
    roles: ['public'],
    group: 'main',
  },
  {
    href: "/cook/orders",
    icon: ListOrdered,
    label: "Orders",
    roles: ['cooker'],
    group: 'cook',
  },
  {
    href: "/cook/earnings",
    icon: PieChart,
    label: "Earnings",
    roles: ['cooker'],
    group: 'cook',
  },
  {
    href: "/driver/deliveries",
    icon: Map,
    label: "Find Deliveries",
    roles: ['delivery'],
    group: 'driver',
  },
  {
    href: "/user/profile",
    icon: User,
    label: "My Profile",
    roles: ['client', 'cooker', 'delivery'],
    group: 'user',
  },
  {
    href: "/user/orders",
    icon: Package,
    label: "My Orders",
    roles: ['client'],
    group: 'user',
  },
];


export function MainNav() {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();

  const visibleLinks = allNavLinks.filter(link => {
    if (link.roles.includes('public')) return true;
    if (user && userProfile && link.roles.includes(userProfile.role)) return true;
    if (!user && link.roles.includes('anonymous')) return true;
    return false;
  });

  const mainMenuItems = visibleLinks.filter(l => l.group === 'main');
  const cookMenuItems = visibleLinks.filter(l => l.group === 'cook');
  const driverMenuItems = visibleLinks.filter(l => l.group === 'driver');
  const userMenuItems = visibleLinks.filter(l => l.group === 'user');

  return (
    <SidebarMenu className="flex-1 p-2">
      {mainMenuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
      ))}

      {cookMenuItems.length > 0 && (
        <>
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
                  isActive={pathname.startsWith(item.href)}
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
        </>
      )}

      {driverMenuItems.length > 0 && (
        <>
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
                  isActive={pathname.startsWith(item.href)}
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
        </>
      )}

      {userMenuItems.length > 0 && (
        <>
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
                  isActive={pathname.startsWith(item.href)}
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
        </>
      )}
    </SidebarMenu>
  );
}
