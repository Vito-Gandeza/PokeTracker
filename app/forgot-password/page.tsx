"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle password reset logic here
    console.log("Password reset requested for:", email)
    setSubmitted(true)
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

            {/* Forgot Password Form */}
            <div className="w-full bg-white text-gray-900 rounded-md shadow-lg p-8 mt-32">
              {!submitted ? (
                <>
                  <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Button type="submit" className="w-full bg-black hover:bg-gray-800">
                      Send Reset Link
                    </Button>
                    <div className="text-sm">
                      <Link href="/login" className="text-blue-500 hover:underline">
                        Back to login
                      </Link>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <h2 className="text-xl font-bold mb-4">Check Your Email</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    We've sent a password reset link to <strong>{email}</strong>
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