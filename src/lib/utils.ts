import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTempPassword(length = 12): string {
  const chars =
    "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

export function formatDateTime(
  date: Date,
  timezone = "America/Edmonton"
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(date: Date, timezone = "America/Edmonton"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTime(date: Date, timezone = "America/Edmonton"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: "#6C757D",
  confirmed: "#3E3573",
  on_the_way: "#8C7BC6",
  in_progress: "#FF9C00",
  completed: "#28A745",
  cancelled: "#DC3545",
  no_show: "#B49C49",
};

export const CANADIAN_TIMEZONES = [
  { label: "Mountain (Edmonton)", value: "America/Edmonton" },
  { label: "Pacific (Vancouver)", value: "America/Vancouver" },
  { label: "Central (Winnipeg)", value: "America/Winnipeg" },
  { label: "Eastern (Toronto)", value: "America/Toronto" },
  { label: "Atlantic (Halifax)", value: "America/Halifax" },
  { label: "Newfoundland (St. John's)", value: "America/St_Johns" },
];
