export type NavItem = {
  label: string;
  href: string;
  icon: string; // Lucide icon name
};

export const adminNavItems: NavItem[] = [
  { label: "Dashboard",     href: "/admin",              icon: "LayoutDashboard" },
  { label: "Users",         href: "/admin/users",        icon: "Users" },
  { label: "Services",      href: "/admin/services",     icon: "Wrench" },
  { label: "Schedule",      href: "/admin/schedule",     icon: "CalendarDays" },
  { label: "Reports",       href: "/admin/reports",      icon: "BarChart3" },
  { label: "Announcements", href: "/admin/announcements",icon: "Megaphone" },
  { label: "Audit Log",     href: "/admin/audit",        icon: "ScrollText" },
];

export const bookerNavItems: NavItem[] = [
  { label: "Dashboard",     href: "/booker",             icon: "LayoutDashboard" },
  { label: "New Booking",   href: "/booker/new",         icon: "PlusCircle" },
  { label: "Customers",     href: "/booker/customers",   icon: "Users" },
  { label: "Schedule",      href: "/booker/schedule",    icon: "CalendarDays" },
];

export const installerNavItems: NavItem[] = [
  { label: "My Jobs",   href: "/installer",          icon: "ClipboardList" },
  { label: "Schedule",  href: "/installer/schedule", icon: "CalendarDays" },
  { label: "Profile",   href: "/installer/profile",  icon: "UserCircle" },
];
