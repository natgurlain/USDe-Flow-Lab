import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "USDe Flow Lab — Supply & market forces",
  description:
    "A public research dashboard connecting USDe supply changes to primary-market flows, carry, funding, leverage loops, and the peg.",
  applicationName: "USDe Flow Lab",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
