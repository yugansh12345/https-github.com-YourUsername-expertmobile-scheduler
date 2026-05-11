import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expert Mobile Scheduler",
  description: "Installation scheduling for Expert Mobile Communications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
