import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Quanta · Venture Intelligence",
  description:
    "For scouts with uncommon access. Join the people surfacing companies before the market knows where to look.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://quantatalent.vercel.app"
  ),
  openGraph: {
    title: "Quanta · Venture Intelligence",
    description: "For scouts with uncommon access.",
    type: "website",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  )
}
