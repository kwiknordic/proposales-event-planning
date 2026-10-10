// Root layout for every page: loads the self-hosted Switzer font and the design system CSS.
import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const switzer = localFont({
  src: [
    { path: "./fonts/Switzer-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Switzer-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-switzer",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Event planning for Proposales",
  description:
    "After accepting a hotel proposal, the client enters the event plan on one page and the hotel gets a clear email.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Browser extensions often add classes to <html> before React loads; ignore that one element only
    <html lang="en" className={`${switzer.variable} antialiased`} suppressHydrationWarning>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
