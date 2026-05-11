"use client";

import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import SidebarNav from "./SidebarNav";
import type { NavItem } from "./nav-items";
import { logoutAction } from "@/app/actions/auth";

interface Props {
  items: NavItem[];
  title: string;
  userName: string;
  userRole: string;
}

export default function TopBar({ items, title, userName, userRole }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--color-primary)] text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            className="p-1 rounded hover:bg-white/10"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link href="/">
            <Image src="/logo.png" alt="Expert Mobile" width={28} height={28} className="object-contain" />
          </Link>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white">
            <LogOut size={18} />
          </button>
        </form>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer */}
          <nav className="relative z-10 w-64 bg-[var(--color-primary)] text-white flex flex-col shadow-xl">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
              <Image src="/logo.png" alt="Expert Mobile" width={32} height={32} className="object-contain" />
              <div>
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-white/50 capitalize">{userRole.toLowerCase()}</p>
              </div>
            </div>
            <div className="flex-1 py-4" onClick={() => setMenuOpen(false)}>
              <SidebarNav items={items} collapsed={false} />
            </div>
            <div className="border-t border-white/10 px-3 py-3">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
