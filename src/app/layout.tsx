import type { Metadata } from "next";
import "./globals.css";
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
      <body>{children}</body>
    </html>
  );
}
