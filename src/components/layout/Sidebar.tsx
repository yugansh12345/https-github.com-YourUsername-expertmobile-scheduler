"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import SidebarNav from "./SidebarNav";
import type { NavItem } from "./nav-items";
import { logoutAction } from "@/app/actions/auth";

const LOGO_URL =
  "https://expertmobile.ca/web/image/website/1/logo_web/Expert%20Mobile%20Communications?unique=ff2967c";

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
        "hidden md:flex flex-col sidebar-gradient text-white shrink-0 transition-all duration-300 relative",
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <Link href="/" className="shrink-0">
          <Image
            src={LOGO_URL}
            alt="Expert Mobile"
            width={36}
            height={36}
            className="rounded-lg object-contain bg-white/10 p-0.5"
            unoptimized
          />
        </Link>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold leading-tight text-white truncate">Expert Mobile</p>
            <p className="text-xs text-white/50 leading-tight">Communications</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3">
        <SidebarNav items={items} collapsed={collapsed} />
      </div>

      {/* User info + logout */}
      <div className="border-t border-white/10 px-3 py-3">
        {!collapsed && (
          <div className="mb-2 px-2 py-2 rounded-lg bg-white/5">
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
        className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary-dark)] border border-white/20 text-white/70 hover:text-white shadow-md transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
