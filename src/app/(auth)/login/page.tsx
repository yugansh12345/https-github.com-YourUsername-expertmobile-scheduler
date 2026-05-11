"use client";

import { useActionState } from "react";
import { loginAction, verifyTOTPLoginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, LogIn, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, null);
  const [totpState, totpFormAction, totpPending] = useActionState(verifyTOTPLoginAction, null);

  const showTOTP = loginState?.requiresTOTP;

  return (
    <div className="w-full max-w-sm">
      {!showTOTP ? (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the scheduler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginFormAction} className="space-y-4">
              {loginState?.error && (
                <Alert variant={loginState.error.includes("locked") ? "warning" : "destructive"}>
                  {loginState.error.includes("locked") ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{loginState.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="login">Username or Email</Label>
                <Input
                  id="login"
                  name="login"
                  type="text"
                  autoComplete="username"
                  placeholder="username or email@example.com"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loginPending}>
                <LogIn className="h-4 w-4" />
                {loginPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-4 text-xs text-center text-[var(--color-text-muted)]">
              Forgot your password?{" "}
              <span className="text-[var(--color-primary)]">
                Contact your administrator to reset it.
              </span>
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Two-Factor Auth</CardTitle>
            <CardDescription className="text-center">
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={totpFormAction} className="space-y-4">
              {totpState?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{totpState.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="code">Authentication Code</Label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9 ]*"
                  maxLength={7}
                  placeholder="000 000"
                  autoComplete="one-time-code"
                  autoFocus
                  className="text-center text-xl tracking-widest"
                />
              </div>

              <Button type="submit" className="w-full" disabled={totpPending}>
                <ShieldCheck className="h-4 w-4" />
                {totpPending ? "Verifying…" : "Verify"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
