import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "../styles/theme-tweakcn.css"
import "../styles/animatopy.css"
import ErrorBoundary from "@/components/error/ErrorBoundary"
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration"
import OfflineNotice from "@/components/pwa/OfflineNotice"
import InstallPrompt from "@/components/pwa/InstallPrompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Comicogs",
  description: "Your Comic Universe, Organized.",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comicogs",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <OfflineNotice />
          {children}
          <InstallPrompt />
          <ServiceWorkerRegistration />
        </ErrorBoundary>
      </body>
    </html>
  )
}