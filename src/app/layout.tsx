import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkPulse KDS | Smart Central Operations Dashboard & Staff Work Orders",
  description: "Real-time kitchen-display style command center for operations, work orders, staff assignments, and SLA monitoring.",
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
