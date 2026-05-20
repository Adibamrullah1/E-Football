import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080f0f",
}

export const metadata: Metadata = {
  title: {
    default: "Liga eFootball Mobile",
    template: "%s | Liga eFootball Mobile",
  },
  description: "Platform liga eFootball Mobile — klasemen, jadwal pertandingan, juara bulanan, dan data pemain.",
  keywords: ["efootball", "liga", "mobile", "esports", "gaming", "klasemen", "jadwal"],
  openGraph: {
    title: "Liga eFootball Mobile",
    description: "Platform liga eFootball Mobile terlengkap.",
    type: "website",
    locale: "id_ID",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
