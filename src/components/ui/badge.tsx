import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted" | "purple";

const variantClasses: Record<BadgeVariant, string> = {
  default:  "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  success:  "bg-green-100 text-green-700",
  warning:  "bg-orange-100 text-orange-700",
  danger:   "bg-red-100 text-red-700",
  muted:    "bg-gray-100 text-gray-600",
  purple:   "bg-purple-100 text-purple-700",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
