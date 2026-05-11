import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expert Mobile Scheduler — Sign In",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-light)]">
      {/* Brand header */}
      <header className="bg-[var(--color-primary)] py-4 px-6 flex items-center justify-center shadow-md">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Expert Mobile Communications"
            className="h-10 object-contain"
          />
          <span className="text-white font-semibold text-lg tracking-wide hidden sm:block">
            Expert Mobile Communications
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      <footer className="py-3 text-center text-xs text-[var(--color-text-muted)]">
        © {new Date().getFullYear()} Expert Mobile Communications Ltd.
      </footer>
    </div>
  );
}
