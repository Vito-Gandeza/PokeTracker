"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="font-semibold">
          <Link href="/">Collector's Corner Philippines</Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/browse" className={`text-sm font-medium ${pathname === "/browse" ? "text-primary" : ""}`}>
            Browse Cards
          </Link>
          <Link href="/tracker" className={`text-sm font-medium ${pathname === "/tracker" ? "text-primary" : ""}`}>
            Price Tracker
          </Link>
          <Link
            href="/pre-orders"
            className={`text-sm font-medium ${pathname === "/pre-orders" ? "text-primary" : ""}`}
          >
            Pre-Orders
          </Link>
          <Link
            href="/notifications"
            className={`text-sm font-medium ${pathname === "/notifications" ? "text-primary" : ""}`}
          >
            Notifications
          </Link>
          <Link href="/profile" className={`text-sm font-medium ${pathname === "/profile" ? "text-primary" : ""}`}>
            Profile
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {pathname !== "/login" && pathname !== "/signup" && (
            <Button asChild variant="default" className="bg-black text-white hover:bg-gray-800">
              <Link href="/login">Log in</Link>
            </Button>
          )}
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-500"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
} 