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
  title: {
    default: "My Defender Will & Trust",
    template: "%s — My Defender Will & Trust",
  },
  description:
    "Create a state-compliant Last Will & Testament or Revocable Living Trust with guided, self-help document preparation software. Available in all 50 states plus DC.",
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
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
