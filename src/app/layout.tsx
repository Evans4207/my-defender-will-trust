import type { Metadata } from "next";
import { Lora, Source_Sans_3, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Serif display font for headings — trustworthy, legal-services aesthetic.
const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

// Sans-serif body font.
const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "My Defender Will & Trust",
    template: "%s — My Defender Will & Trust",
  },
  description:
    "Create a state-compliant Last Will & Testament or Revocable Living Trust with guided, self-help document preparation software. Available in all 50 states plus DC.",
  openGraph: {
    title: "My Defender Will & Trust",
    description:
      "Guided, self-help Will & Trust document preparation for all 50 states plus DC. Protection before panic.",
    type: "website",
    siteName: "My Defender Will & Trust",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${lora.variable} ${sourceSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-navy focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
