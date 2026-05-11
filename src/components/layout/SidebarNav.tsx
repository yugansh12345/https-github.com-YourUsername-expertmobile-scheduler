"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./nav-items";
import {
  LayoutDashboard, Users, Wrench, CalendarDays, BarChart3,
  Megaphone, ScrollText, PlusCircle, ClipboardList, LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Users, Wrench, CalendarDays, BarChart3,
  Megaphone, ScrollText, PlusCircle, ClipboardList,
};

interface Props {
  items: NavItem[];
  collapsed: boolean;
}

export default function SidebarNav({ items, collapsed }: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive =
          item.href === "/admin" || item.href === "/booker"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/20 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white",
              collapsed ? "justify-center" : "",
            ].join(" ")}
            title={collapsed ? item.label : undefined}
          >
            {Icon && <Icon size={18} className="shrink-0" />}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
