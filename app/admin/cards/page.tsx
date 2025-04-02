"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminNav } from "@/components/admin-nav"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabase"

interface Card {
  id: string
  name: string
  set_name: string
  card_number: string
  rarity: string
  image_url: string
  created_at: string
}

export default function AdminCardsPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [userName, setUserName] = useState("Admin")
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCards, setTotalCards] = useState(0)
  const cardsPerPage = 10
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

  // Fetch cards with pagination
  useEffect(() => {
    const fetchCards = async () => {
      if (!isAuthenticated || authLoading) return

      setIsLoading(true)
      setError(null)

      try {
        // Build query
        let query = supabase
          .from('cards')
          .select('*', { count: 'exact' })
        
        // Add search if provided
        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,set_name.ilike.%${searchQuery}%,card_number.ilike.%${searchQuery}%`)
        }
        
        // Add pagination
        const from = (currentPage - 1) * cardsPerPage
        const to = from + cardsPerPage - 1
        
        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(from, to)
        
        if (error) {
          setError(error.message)
          return
        }
        
        setCards(data || [])
        setTotalCards(count || 0)
      } catch (err) {
        setError('An unexpected error occurred')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCards()
  }, [isAuthenticated, authLoading, searchQuery, currentPage])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return

    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)
      
      if (error) {
        setError(error.message)
        return
      }
      
      // Update the local state
      setCards(cards.filter(card => card.id !== cardId))
      setTotalCards(prev => prev - 1)
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

  const totalPages = Math.ceil(totalCards / cardsPerPage)

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <div className="flex-1 flex flex-col">
        {/* Admin Header */}
        <header className="border-b bg-white">
          <div className="container flex h-16 items-center justify-between px-4">
            <h1 className="text-2xl font-bold">Card Management</h1>
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

          <div className="mb-6 flex justify-between items-center">
            <form onSubmit={handleSearch} className="flex w-full max-w-md gap-2">
              <Input
                type="search"
                placeholder="Search by name, set or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </form>
            <Button className="bg-green-600 hover:bg-green-700">Add New Card</Button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Card
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Set
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rarity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
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
                        Loading cards...
                      </td>
                    </tr>
                  ) : cards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        No cards found
                      </td>
                    </tr>
                  ) : (
                    cards.map((card) => (
                      <tr key={card.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {card.image_url && (
                              <img 
                                src={card.image_url} 
                                alt={card.name}
                                className="w-10 h-10 object-cover mr-3 rounded"
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900">{card.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{card.set_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{card.card_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {card.rarity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(card.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteCard(card.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * cardsPerPage + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * cardsPerPage, totalCards)}
                </span>{" "}
                of <span className="font-medium">{totalCards}</span> cards
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 