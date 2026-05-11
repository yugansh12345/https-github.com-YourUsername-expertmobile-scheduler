"use client";

import { useActionState } from "react";
import { firstLoginChangePasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, KeyRound, CheckCircle2 } from "lucide-react";

const REQUIREMENTS = [
  { label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One symbol (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function FirstLoginPage() {
  const [state, formAction, pending] = useActionState(firstLoginChangePasswordAction, null);

  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-[var(--color-primary)]" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Set your password</CardTitle>
          <CardDescription className="text-center">
            You must create a new password before continuing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                required
                autoFocus
              />
              {state?.fieldErrors?.password && (
                <ul className="text-xs text-[#DC3545] space-y-0.5 mt-1">
                  {state.fieldErrors.password.map((e) => (
                    <li key={e} className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" /> {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                required
              />
              {state?.fieldErrors?.confirmPassword && (
                <p className="text-xs text-[#DC3545] mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {state.fieldErrors.confirmPassword[0]}
                </p>
              )}
            </div>

            {/* Live requirements checklist (visual hint only — server validates) */}
            <div className="rounded-md bg-[var(--color-surface-light)] p-3 space-y-1">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                Password must have:
              </p>
              {REQUIREMENTS.map((r) => (
                <div key={r.label} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--color-border)]" />
                  {r.label}
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              <KeyRound className="h-4 w-4" />
              {pending ? "Saving…" : "Save new password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
