import type React from "react"
import type { Metadata, Viewport } from "next"
import { RoleProvider } from "@/lib/role-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kwik Konnect | Find Jobs Faster",
  description:
    "AI-powered job matching platform with blockchain-verified credentials, CV builder, and interview coaching for Sierra Leone youth.",
  keywords: ["jobs", "career", "AI", "blockchain", "Sierra Leone", "employment", "CV builder", "Kwik Konnect"],
  generator: "Kwik Konnect",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      </head>
      <body className="font-sans antialiased">
        <RoleProvider>
          {children}
          <Toaster />
        </RoleProvider>
      </body>
    </html>
  )
}
