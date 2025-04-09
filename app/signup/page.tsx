"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { signUp } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignupPage() {
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

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
      console.log("Signup attempt with:", { fullName, username, email, password })

      const result = await signUp({
        email,
        password,
        fullName,
        username
      })

      if (result.error) {
        setError(result.error.message)
        console.error("Signup error:", result.error)
        return
      }

      // Success
      setSuccess(true)

      // Redirect to profile page after successful signup
      setTimeout(() => {
        router.push("/profile")
      }, 2000)

    } catch (err) {
      console.error("Unexpected error during signup:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
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
            {/* Signup Form */}
            <div className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              {success ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-800 dark:text-green-200 mb-4">
                  <h3 className="font-medium text-lg mb-2">Registration Successful!</h3>
                  <p>Your account has been created. Redirecting to your profile...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="mb-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                      required
                      className="w-full"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      required
                      className="w-full"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      required
                      className="w-full"
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                        Creating Account...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                  <div className="text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-500 hover:underline">
                      Log in
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}