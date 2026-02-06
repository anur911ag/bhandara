import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1b4332",
};

export const metadata: Metadata = {
  title: "Bhandara - Free Food Camps Near You",
  description:
    "Find free food camps, langars, and bhandaras near you. Share and discover community food events.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-background`}>
        <main className="pb-20 min-h-dvh">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
