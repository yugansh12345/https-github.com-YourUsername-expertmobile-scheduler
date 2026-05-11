import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expert Mobile Scheduler — Sign In",
};

const LOGO_URL =
  "https://expertmobile.ca/web/image/website/1/logo_web/Expert%20Mobile%20Communications?unique=ff2967c";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen auth-bg flex flex-col items-center justify-center p-4">
      {/* Brand mark */}
      <div className="flex items-center gap-4 mb-8 animate-fade-up">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_URL}
          alt="Expert Mobile Communications"
          className="h-14 w-14 object-contain rounded-2xl bg-white/10 p-1.5 shadow-lg"
        />
        <div>
          <p className="text-white font-bold text-2xl leading-tight">Expert Mobile</p>
          <p className="text-white/60 text-sm">Communications Ltd.</p>
        </div>
      </div>

      {/* Content */}
      <main className="w-full max-w-md animate-fade-up" style={{ animationDelay: "80ms" }}>
        {children}
      </main>

      <footer className="mt-10 text-white/40 text-xs">
        © {new Date().getFullYear()} Expert Mobile Communications Ltd.
      </footer>
    </div>
  );
}
