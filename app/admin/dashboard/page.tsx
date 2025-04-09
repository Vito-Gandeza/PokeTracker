"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabase"

interface StatsData {
  totalUsers: number
  totalCards: number
  totalCollections: number
  newUsersThisWeek: number
}

export default function AdminDashboardPage() {
  const { userProfile, isAuthenticated, isLoading: authLoading, signOut } = useAuth()
  const [userName, setUserName] = useState("Admin")
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalCards: 0,
    totalCollections: 0,
    newUsersThisWeek: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // If user data is available, update the displayed name
    if (userProfile?.email) {
      setUserName(userProfile.email.split('@')[0])
    }
  }, [userProfile])

  // No need to check admin status here as it's already handled by the ProtectedRoute component

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated || authLoading) return

      setIsLoading(true)

      try {
        // Get total users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id')

        // Get new users this week
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const { data: newUsersData, error: newUsersError } = await supabase
          .from('users')
          .select('id')
          .gte('created_at', oneWeekAgo.toISOString())

        // Get collections count
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('collections')
          .select('id')

        // Get total cards
        const { data: cardsData, error: cardsError } = await supabase
          .from('cards')
          .select('id')

        if (usersError || newUsersError || collectionsError || cardsError) {
          console.error('Error fetching stats:', { usersError, newUsersError, collectionsError, cardsError })
          return
        }

        setStats({
          totalUsers: usersData?.length || 0,
          totalCards: cardsData?.length || 0,
          totalCollections: collectionsData?.length || 0,
          newUsersThisWeek: newUsersData?.length || 0
        })
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [isAuthenticated, authLoading])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Dashboard Overview
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Welcome, {userName}!</span>
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <h3 className="text-3xl font-bold">{isLoading ? "..." : stats.totalUsers}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
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
                      className="text-blue-500"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    <span className="text-green-500">+{isLoading ? "..." : stats.newUsersThisWeek}</span> new this week
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Cards</p>
                    <h3 className="text-3xl font-bold">{isLoading ? "..." : stats.totalCards}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
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
                      className="text-red-500"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                      <path d="M3 10h18" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Tracked in database</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Collections</p>
                    <h3 className="text-3xl font-bold">{isLoading ? "..." : stats.totalCollections}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
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
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">User collections</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}