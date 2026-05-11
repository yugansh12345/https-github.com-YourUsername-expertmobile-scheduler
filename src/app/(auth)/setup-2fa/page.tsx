"use client";

import { useActionState, useEffect, useState } from "react";
import { generate2FASecretAction, confirm2FASetupAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck, Copy, Check } from "lucide-react";

export default function Setup2FAPage() {
  const [qrData, setQrData] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState(confirm2FASetupAction, null);

  useEffect(() => {
    generate2FASecretAction().then((data) => {
      setQrData(data);
      setLoading(false);
    });
  }, []);

  function copySecret() {
    if (qrData?.secret) {
      navigator.clipboard.writeText(qrData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-[var(--color-primary)]" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Set up 2FA</CardTitle>
          <CardDescription className="text-center">
            Scan the QR code with Google Authenticator, Authy, or any TOTP app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            {loading ? (
              <div className="h-44 w-44 rounded-lg bg-[var(--color-surface-light)] animate-pulse" />
            ) : qrData ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrData.qrDataUrl}
                  alt="2FA QR Code"
                  className="h-44 w-44 rounded-lg border border-[var(--color-border)]"
                />
                <div className="w-full">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1 text-center">
                    Or enter this key manually:
                  </p>
                  <div className="flex items-center gap-2 bg-[var(--color-surface-light)] rounded-md px-3 py-2">
                    <code className="text-xs font-mono flex-1 break-all tracking-wider">
                      {qrData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] shrink-0"
                      title="Copy secret"
                    >
                      {copied ? <Check className="h-4 w-4 text-[#28A745]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>Failed to generate QR code. Refresh the page.</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Verify form */}
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9 ]*"
                maxLength={7}
                placeholder="000 000"
                autoComplete="one-time-code"
                className="text-center text-xl tracking-widest"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={pending || loading}>
              <ShieldCheck className="h-4 w-4" />
              {pending ? "Verifying…" : "Enable 2FA"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
