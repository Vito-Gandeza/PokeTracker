"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AdminNav } from "@/components/admin-nav"
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
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
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
    if (user?.user_metadata?.full_name) {
      setUserName(user.user_metadata.full_name)
    } else if (user?.email) {
      setUserName(user.email.split('@')[0])
    }
  }, [user])

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || authLoading) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user?.id)
          .single()
        
        if (error) {
          console.error('Error checking admin status:', error)
          router.push('/')
          return
        }

        if (!data || !data.is_admin) {
          console.error('User is not an admin')
          router.push('/')
        }
      } catch (err) {
        console.error('Error:', err)
        router.push('/')
      }
    }

    checkAdminStatus()
  }, [isAuthenticated, authLoading, user, router])

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated || authLoading) return

      setIsLoading(true)

      try {
        // Get total users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id')
          
        // Get new users this week
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        
        const { data: newUsersData, error: newUsersError } = await supabase
          .from('profiles')
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
    await logout()
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
    <div className="flex min-h-screen">
      <AdminNav />
      <div className="flex-1 flex flex-col">
        {/* Admin Header */}
        <header className="border-b bg-white">
          <div className="container flex h-16 items-center justify-between px-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span>Welcome, {userName}!</span>
              <Button variant="link" className="text-black hover:text-gray-700" onClick={handleLogout}>
                Log out
              </Button>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
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

        <main className="flex-1 p-6">
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

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">System Status</p>
                    <h3 className="text-3xl font-bold text-green-500">Active</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
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
                      className="text-green-500"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">All systems operational</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">New user registered</p>
                      <p className="text-xs text-gray-500">Jane Smith (jane@example.com)</p>
                      <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Collection completed</p>
                      <p className="text-xs text-gray-500">John Doe completed Base Set</p>
                      <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">New card added</p>
                      <p className="text-xs text-gray-500">Admin added 15 new cards to database</p>
                      <p className="text-xs text-gray-500 mt-1">6 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Admin Quick Links</h3>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="flex flex-col items-center justify-center h-24 bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200" 
                    onClick={() => router.push('/admin/users')}>
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
                      className="mb-2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Manage Users
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 bg-green-50 hover:bg-green-100 text-green-900 border-green-200"
                    onClick={() => router.push('/admin/cards')}>
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
                      className="mb-2"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                      <path d="M3 10h18" />
                    </svg>
                    Manage Cards
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200"
                    onClick={() => router.push('/admin/collections')}>
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
                      className="mb-2"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    Collections
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 bg-red-50 hover:bg-red-100 text-red-900 border-red-200"
                    onClick={() => router.push('/admin/settings')}>
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
                      className="mb-2"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">System Announcements</h3>
                <Button variant="outline" size="sm">Add Announcement</Button>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm leading-5 font-medium text-blue-800">System Update Scheduled</h3>
                      <div className="mt-2 text-sm leading-5 text-blue-700">
                        <p>There will be a scheduled maintenance window this Sunday from 2am to 4am UTC. The system may be unavailable during this time.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm leading-5 font-medium text-green-800">New Cards Added</h3>
                      <div className="mt-2 text-sm leading-5 text-green-700">
                        <p>The latest expansion has been added to the database with 150+ new cards. Users can now add these to their collections.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
} 