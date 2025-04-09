"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useAuth } from "@/lib/auth-context"
import supabase from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)
  const router = useRouter()
  const { signIn } = useAuth()

  // Show troubleshooting options after 5 seconds if an error occurs
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (error) {
      timer = setTimeout(() => {
        setShowTroubleshooting(true);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setShowTroubleshooting(false)

    try {
      const result = await signIn(email, password)
      if (result.error) {
        setError(result.error)
        return
      }

      // Wait a moment for the auth state to update
      setTimeout(async () => {
        try {
          // Check if the user is an admin
          const { data: profile } = await supabase
            .from('users')
            .select('is_admin')
            .eq('email', email)
            .single()

          console.log('DEBUG: Login check - user profile:', profile)

          // Redirect to appropriate page based on admin status
          if (profile?.is_admin) {
            router.push("/admin")
          } else {
            router.push("/profile")
          }
        } catch (err) {
          console.error('Error during redirect check:', err)
          // Default to profile page if check fails
          router.push("/profile")
        }
      }, 500)
    } catch (err) {
      console.error('Login error:', err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const clearAuthState = async () => {
    try {
      console.log('Clearing auth state...')
      // Sign out with global scope to clear all sessions
      await supabase.auth.signOut({ scope: 'global' })
      // Clear all local storage and session storage
      localStorage.clear()
      sessionStorage.clear()
      // Reload the page to ensure everything is fresh
      window.location.reload()
    } catch (err) {
      console.error('Error clearing auth state:', err)
      setError('Failed to clear auth state. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col">
        {/* Hero Section with Form */}
        <section className="relative flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30"></div>

          <div className="relative z-10 mx-auto flex justify-center items-center w-full max-w-md px-4 py-8">
            {/* Login Form */}
            <div className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                    {showTroubleshooting && (
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <p className="text-sm font-medium">Having trouble logging in?</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-1 text-xs"
                          onClick={clearAuthState}
                        >
                          Clear Auth State
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log In"}
                </Button>
                <div className="text-sm">
                  <Link href="/forgot-password" className="text-blue-500 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="text-sm">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-blue-500 hover:underline">
                    Sign up
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}