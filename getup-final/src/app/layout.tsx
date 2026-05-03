import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Crest Capital — finance at its peak",
    template: "%s · Crest Capital",
  },
  description:
    "Crest Capital is the mobile bank built for Europe — real-time SEPA transfers, worldwide SWIFT, Spaces savings with 2,26% interest, and a metal card that works everywhere.",
  metadataBase: new URL("https://crestcapital.com"),
  applicationName: "Crest Capital",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Crest Capital — finance at its peak",
    description:
      "The mobile bank built for Europe. Real-time SEPA, worldwide SWIFT, Spaces savings.",
    type: "website",
    siteName: "Crest Capital",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crest Capital — finance at its peak",
    description:
      "The mobile bank built for Europe. Real-time SEPA, worldwide SWIFT, Spaces savings.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f66ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-ink-900 antialiased">{children}</body>
    </html>
  );
}
