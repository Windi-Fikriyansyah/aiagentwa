import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentFlow AI - Admin Dashboard",
  description: "Dashboard Overview for AgentFlow AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="bg-background text-on-background antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
