"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AdminNav } from "@/components/admin-nav"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabase"

// Type for a user profile
interface UserProfile {
  id: string
  email: string
  username: string
  full_name: string
  role: string
  is_admin: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [userName, setUserName] = useState("Admin")
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAuthenticated || authLoading) return

      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          setError(error.message)
        } else {
          setUsers(data || [])
        }
      } catch (err) {
        setError('An unexpected error occurred')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [isAuthenticated, authLoading])

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc(
        'set_admin_role',
        { user_id: userId, set_admin: !currentStatus }
      )

      if (error) {
        setError(error.message)
        return
      }

      // Update the local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              is_admin: !currentStatus,
              role: !currentStatus ? 'admin' : 'user' 
            } 
          : user
      ))
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    }
  }

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
            <h1 className="text-2xl font-bold">User Management</h1>
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
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((profile) => (
                      <tr key={profile.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{profile.full_name || 'Not set'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{profile.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{profile.username || 'Not set'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            profile.is_admin 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {profile.role || (profile.is_admin ? 'admin' : 'user')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleAdminStatus(profile.id, profile.is_admin)}
                            className="mr-2"
                          >
                            {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 