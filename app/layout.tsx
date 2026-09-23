import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "PAIR Assessment Tool | Physical AI Readiness",
  icons: { icon: "/favicon.svg" },
  description:
    "A source-available assessment framework for evaluating Physical AI readiness across Place, Architecture, Institutions, and Returns.",
  openGraph: {
    title: "PAIR Assessment Tool",
    description: "Physical AI Readiness across Place, Architecture, Institutions, and Returns.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "PAIR Assessment Tool — Physical AI Readiness" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PAIR Assessment Tool",
    description: "Physical AI Readiness across Place, Architecture, Institutions, and Returns.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
