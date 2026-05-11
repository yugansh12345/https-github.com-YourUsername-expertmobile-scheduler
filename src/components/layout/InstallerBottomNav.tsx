"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CalendarDays, UserCircle, LucideIcon } from "lucide-react";
import type { NavItem } from "./nav-items";

const ICONS: Record<string, LucideIcon> = {
  ClipboardList,
  CalendarDays,
  UserCircle,
};

interface Props {
  items: NavItem[];
}

export default function InstallerBottomNav({ items }: Props) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--color-border)] flex md:hidden">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive =
          item.href === "/installer"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
              isActive
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]",
            ].join(" ")}
          >
            {Icon && (
              <Icon
                size={22}
                className={isActive ? "text-[var(--color-primary)]" : ""}
              />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
