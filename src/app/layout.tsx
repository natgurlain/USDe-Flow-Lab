import type { Metadata } from "next";
import "./globals.css";
import DashboardShell from "@/components/dashboard-shell";
export const metadata: Metadata = {
  title: "Ethena Explained",
  description:
    "Understand Ethena, USDe supply, sUSDe yield, backing, and risks with a simple independent dashboard and clear data sources.",
  applicationName: "Ethena Explained",
  openGraph: {
    title: "Ethena Explained",
    description: "Ethena’s dollars, yield, and risks. In plain English.",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
