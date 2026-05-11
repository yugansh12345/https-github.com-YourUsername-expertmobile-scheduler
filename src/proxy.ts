import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession } from "@/lib/session";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/logo.png",
];

const FIRST_LOGIN_PATH = "/first-login";
const SETUP_2FA_PATH = "/setup-2fa";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("em_session")?.value;
  const session = token ? await decryptSession(token) : null;

  if (!session?.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Force password change before accessing anything else
  if (session.mustChangePassword && pathname !== FIRST_LOGIN_PATH) {
    return NextResponse.redirect(new URL(FIRST_LOGIN_PATH, request.url));
  }

  // Root redirect → role dashboard
  if (pathname === "/") {
    const dest = roleHomePath(session.role);
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Guard role-specific routes
  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(
      new URL(roleHomePath(session.role), request.url)
    );
  }
  if (
    pathname.startsWith("/booker") &&
    !["ADMIN", "BOOKER"].includes(session.role)
  ) {
    return NextResponse.redirect(
      new URL(roleHomePath(session.role), request.url)
    );
  }
  if (
    pathname.startsWith("/installer") &&
    !["ADMIN", "INSTALLER"].includes(session.role)
  ) {
    return NextResponse.redirect(
      new URL(roleHomePath(session.role), request.url)
    );
  }

  return NextResponse.next();
}

function roleHomePath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "BOOKER":
      return "/booker";
    case "INSTALLER":
      return "/installer";
    default:
      return "/login";
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};
