import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/context/cart-context"
import { CurrencyProvider } from "@/lib/currency-context"
import { Toaster } from "@/components/ui/toaster"
import dynamic from "next/dynamic"
import RecoveryScript from "./recovery-script"

// Import ErrorBoundary with dynamic import to avoid SSR issues
const ErrorBoundary = dynamic(() => import("@/components/error-boundary"), {
  ssr: false,
})

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Collector's Corner Philippines",
  description: "The best collectible products at the best prices",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <RecoveryScript />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ErrorBoundary>
            <AuthProvider>
              <CartProvider>
                <CurrencyProvider>
                  {children}
                  <Toaster />
                </CurrencyProvider>
              </CartProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}

