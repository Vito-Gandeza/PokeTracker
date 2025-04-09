"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import supabase from "@/lib/supabase"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect if we don't have hash params (coming from email link)
  useEffect(() => {
    if (!searchParams?.has('code')) {
      router.push('/login')
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Automatically redirect after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col">
        {/* Hero Section with Form */}
        <section className="relative flex-1 flex items-center justify-center bg-slate-800 text-white">
          <div className="absolute inset-0 bg-[url('/images/cover_page.png')] bg-cover bg-center opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <div className="relative z-10 mx-auto flex justify-center items-center w-full max-w-md px-4 py-8">
            {/* Logo */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
              <div className="h-24 w-24 relative">
                <svg viewBox="0 0 100 100" className="fill-white">
                  <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0z" />
                  <path d="M35 30L65 50L35 70V30z" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Reset Password Form */}
            <div className="w-full bg-white text-gray-900 rounded-md shadow-lg p-8 mt-32">
              {!success ? (
                <>
                  <h2 className="text-xl font-bold mb-4">Set New Password</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Please enter your new password below.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                        className="w-full"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full"
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-black hover:bg-gray-800"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <h2 className="text-xl font-bold mb-4">Password Updated</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Your password has been successfully updated. You will be redirected to the login page shortly.
                  </p>
                  <Button asChild className="mt-4 bg-black hover:bg-gray-800">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}