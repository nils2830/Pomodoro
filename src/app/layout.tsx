import type { Metadata, Viewport } from "next";
import "@fontsource-variable/geologica/full.css";
import "@fontsource-variable/martian-mono/standard.css";
import "@fontsource-variable/host-grotesk";
import "@fontsource-variable/familjen-grotesk";
import "@fontsource-variable/newsreader/standard.css";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./globals.css";
import { BOOT_SCRIPT } from "@/core/shell/useAppearance";

const description = "A calm focus timer with an evidence-based warm-up, a clock you can hide, and honest insights into how often you actually sit down to work.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Steen · Focus, set in stone", template: "%s · Steen" },
  description,
  applicationName: "Steen",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Steen", statusBarStyle: "black-translucent" },
  openGraph: { type: "website", siteName: "Steen", title: "Steen · Focus, set in stone", description, images: [{ url: "/og.jpg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Steen · Focus, set in stone", description, images: ["/og.jpg"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f0ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0d0b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
