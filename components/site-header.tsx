"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase"
import CartIndicator from "@/components/cart-indicator"
import { CurrencySwitcher } from "@/components/currency-switcher"
import { motion } from "framer-motion"
import { Search, Menu } from "lucide-react"
import { useState, useEffect } from "react"

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isAdmin, signOut } = useAuth()
  const supabase = createClient()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    console.log('DEBUG: Header logout button clicked');
    try {
      // Use our auth context's signOut which handles everything
      await signOut();
      console.log('DEBUG: Logout successful');

      // Navigate to login page
      router.push('/login');
    } catch (error) {
      console.error('DEBUG: Error in header logout:', error);
      // Even if there's an error, try to redirect to login
      router.push('/login');
    }
  };

  return (
    <motion.header
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm' : 'bg-white dark:bg-gray-900'} border-b border-gray-200 dark:border-gray-800`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <motion.div
          className="font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/" className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">Collector's Corner</Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: '/shop/all-cards', label: 'Browse Cards' },
            { href: '/tracker', label: 'Price Tracker' },
            { href: '/profile', label: 'Profile' },
            ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel' }] : [])
          ].map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <Link
                href={link.href}
                className={`text-sm font-medium relative ${pathname === link.href || (link.href === '/admin' && pathname.startsWith('/admin')) ? 'text-primary' : ''}`}
              >
                {link.label}
                {(pathname === link.href || (link.href === '/admin' && pathname.startsWith('/admin'))) && (
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"
                    layoutId="underline"
                  />
                )}
              </Link>
            </motion.div>
          ))}

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="ml-2"
          >
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
            </Button>
          </motion.div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <CurrencySwitcher />
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <CartIndicator />
          </motion.div>

          {!isAuthenticated && pathname !== "/login" && pathname !== "/signup" && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-sm">
                <Link href="/login">Log in</Link>
              </Button>
            </motion.div>
          )}

          {isAuthenticated && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="default"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-sm"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </motion.div>
          )}

          {isAuthenticated && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="container py-4 px-4 flex flex-col space-y-3">
            {[
              { href: '/shop/all-cards', label: 'Browse Cards' },
              { href: '/tracker', label: 'Price Tracker' },
              { href: '/profile', label: 'Profile' },
              ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel' }] : [])
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium py-2 ${pathname === link.href || (link.href === '/admin' && pathname.startsWith('/admin')) ? 'text-primary' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}