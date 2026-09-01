import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkPulse | Team Operations Dashboard & Staff Work Orders",
  description: "Real-time team operations dashboard, work orders, crew assignments, and SLA monitoring.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
