"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword, validatePasswordStrength } from "@/lib/passwords";
import { createSession, getSession, deleteSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { generateTempPassword } from "@/lib/utils";
import { generateSecret, generateURI, verify as verifyOTP } from "otplib";
import QRCode from "qrcode";

const MAX_FAILED_ATTEMPTS = 5;

// ─── Login ───────────────────────────────────────────────────────────────────

export type LoginState = {
  error?: string;
  requiresTOTP?: boolean;
  tempToken?: string; // opaque token passed to the TOTP step
} | null;

const LoginSchema = z.object({
  login: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { login, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: login.toLowerCase() }, { username: login.toLowerCase() }],
    },
  });

  // Generic message for non-existent users (don't reveal existence)
  if (!user) {
    return { error: "Invalid username or password" };
  }

  if (user.isLocked) {
    return {
      error: "Account locked. Contact your administrator.",
    };
  }

  if (!user.isActive) {
    return { error: "Account deactivated. Contact your administrator." };
  }

  const passwordValid = await verifyPassword(password, user.hashedPassword);

  if (!passwordValid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        isLocked: shouldLock,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: shouldLock ? "LOGIN_LOCKED" : "LOGIN_FAILED",
      metadata: { attempts: newAttempts },
    });

    if (shouldLock) {
      return { error: "Account locked after too many failed attempts. Contact your administrator." };
    }

    const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
    return {
      error: `Invalid username or password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Successful auth — reset failed attempts, record login time
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lastLoginAt: new Date() },
  });

  await writeAuditLog({ userId: user.id, action: "LOGIN_SUCCESS" });

  // 2FA required and already set up — need TOTP verification before session
  if (user.twoFactorRequired && user.twoFactorVerified && user.twoFactorSecret) {
    try {
      await createSession({
        userId: user.id,
        role: user.role as "ADMIN" | "BOOKER" | "INSTALLER",
        mustChangePassword: user.mustChangePassword,
      });
    } catch (e) {
      console.error("[login] createSession failed:", e);
      return { error: "Session error — check SESSION_SECRET env var." };
    }
    return { requiresTOTP: true };
  }

  try {
    await createSession({
      userId: user.id,
      role: user.role as "ADMIN" | "BOOKER" | "INSTALLER",
      mustChangePassword: user.mustChangePassword,
    });
  } catch (e) {
    console.error("[login] createSession failed:", e);
    return { error: "Session error — check SESSION_SECRET env var." };
  }

  // redirect() throws internally — must be outside try/catch
  redirect(
    user.mustChangePassword
      ? "/first-login"
      : user.twoFactorRequired && !user.twoFactorVerified
        ? "/setup-2fa"
        : roleDashboard(user.role)
  );
}

// ─── TOTP Verify (login second step) ────────────────────────────────────────

export type TOTPVerifyState = { error?: string } | null;

export async function verifyTOTPLoginAction(
  _prev: TOTPVerifyState,
  formData: FormData
): Promise<TOTPVerifyState> {
  const session = await getSession();
  if (!session?.userId) return { error: "Session expired. Please log in again." };

  const code = (formData.get("code") as string)?.replace(/\s/g, "");
  if (!code || code.length !== 6) return { error: "Enter the 6-digit code from your authenticator app." };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { twoFactorSecret: true, twoFactorVerified: true, role: true, mustChangePassword: true },
  });

  if (!user?.twoFactorSecret) return { error: "2FA not configured." };

  const valid = verifyOTP({ token: code, secret: user.twoFactorSecret });
  if (!valid) return { error: "Invalid code. Try again." };

  redirect(user.mustChangePassword ? "/first-login" : roleDashboard(user.role));
}

// ─── First Login — Force Password Change ────────────────────────────────────

export type ChangePasswordState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

const ChangePasswordSchema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function firstLoginChangePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const raw = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = ChangePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const strengthErrors = validatePasswordStrength(raw.password);
  if (strengthErrors.length > 0) {
    return { fieldErrors: { password: strengthErrors } };
  }

  const hashed = await hashPassword(raw.password);

  await prisma.user.update({
    where: { id: session.userId },
    data: { hashedPassword: hashed, mustChangePassword: false },
  });

  await writeAuditLog({ userId: session.userId, action: "PASSWORD_CHANGED" });

  // Refresh session with mustChangePassword=false
  await createSession({ ...session, mustChangePassword: false });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { twoFactorRequired: true, twoFactorVerified: true, role: true },
  });

  redirect(
    user?.twoFactorRequired && !user.twoFactorVerified
      ? "/setup-2fa"
      : roleDashboard(user?.role ?? "INSTALLER")
  );
}

// ─── 2FA Setup ───────────────────────────────────────────────────────────────

export async function generate2FASecretAction(): Promise<{
  secret: string;
  qrDataUrl: string;
  otpauthUrl: string;
}> {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, username: true },
  });

  const secret = generateSecret();
  const otpauthUrl = generateURI({
    label: user?.email ?? user?.username ?? "user",
    issuer: "Expert Mobile Scheduler",
    secret,
  });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Store secret temporarily (not yet verified)
  await prisma.user.update({
    where: { id: session.userId },
    data: { twoFactorSecret: secret, twoFactorVerified: false },
  });

  return { secret, qrDataUrl, otpauthUrl };
}

export type Setup2FAState = { error?: string } | null;

export async function confirm2FASetupAction(
  _prev: Setup2FAState,
  formData: FormData
): Promise<Setup2FAState> {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const code = (formData.get("code") as string)?.replace(/\s/g, "");
  if (!code || code.length !== 6) return { error: "Enter the 6-digit code." };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { twoFactorSecret: true, role: true },
  });

  if (!user?.twoFactorSecret) return { error: "No 2FA secret found. Refresh and try again." };

  const valid = verifyOTP({ token: code, secret: user.twoFactorSecret });
  if (!valid) return { error: "Invalid code. Make sure your device time is synced." };

  await prisma.user.update({
    where: { id: session.userId },
    data: { twoFactorVerified: true },
  });

  await writeAuditLog({ userId: session.userId, action: "TWO_FACTOR_ENABLED" });

  redirect(roleDashboard(user.role));
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const session = await getSession();
  if (session?.userId) {
    await writeAuditLog({ userId: session.userId, action: "LOGOUT" });
  }
  await deleteSession();
  redirect("/login");
}

// ─── Admin: Reset User Password ──────────────────────────────────────────────

export type ResetPasswordResult = { success: true; tempPassword: string } | { success: false; error: string };

export async function adminResetPasswordAction(userId: string): Promise<ResetPasswordResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const tempPassword = generateTempPassword();
  const hashed = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { hashedPassword: hashed, mustChangePassword: true, failedLoginAttempts: 0, isLocked: false },
  });

  await prisma.passwordResetEvent.create({
    data: { userId, resetByAdminId: session.userId },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "PASSWORD_RESET",
    entityType: "User",
    entityId: userId,
  });

  return { success: true, tempPassword };
}

// ─── Admin: Lock / Unlock ─────────────────────────────────────────────────────

export async function adminToggleLockAction(userId: string, lock: boolean): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { error: "Unauthorized" };

  await prisma.user.update({
    where: { id: userId },
    data: { isLocked: lock, ...(lock ? {} : { failedLoginAttempts: 0 }) },
  });

  await writeAuditLog({
    userId: session.userId,
    action: lock ? "USER_LOCKED" : "USER_UNLOCKED",
    entityType: "User",
    entityId: userId,
  });

  return {};
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roleDashboard(role: string): string {
  switch (role) {
    case "ADMIN": return "/admin";
    case "BOOKER": return "/booker";
    default: return "/installer";
  }
}
