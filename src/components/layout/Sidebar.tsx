"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import SidebarNav from "./SidebarNav";
import type { NavItem } from "./nav-items";
import { logoutAction } from "@/app/actions/auth";

interface Props {
  items: NavItem[];
  userName: string;
  userRole: string;
}

export default function Sidebar({ items, userName, userRole }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={[
        "hidden md:flex flex-col bg-[var(--color-primary)] text-white shrink-0 transition-all duration-200",
        collapsed ? "w-16" : "w-56",
      ].join(" ")}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt="Expert Mobile"
            width={36}
            height={36}
            className="rounded object-contain"
          />
        </Link>
        {!collapsed && (
          <span className="text-sm font-semibold leading-tight">
            Expert Mobile
          </span>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav items={items} collapsed={collapsed} />
      </div>

      {/* User info + logout */}
      <div className="border-t border-white/10 px-3 py-3">
        {!collapsed && (
          <div className="mb-2 px-1">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-white/50 capitalize">{userRole.toLowerCase()}</p>
          </div>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className={[
              "flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors",
              collapsed ? "justify-center" : "",
            ].join(" ")}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </form>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] border border-white/20 text-white/70 hover:text-white shadow-sm"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
