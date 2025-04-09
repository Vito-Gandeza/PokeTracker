"use client"

import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import supabase from "@/lib/supabase"
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  Settings,
  PackageOpen,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const { userProfile, refreshUserProfile } = useAuth()
  const [userId, setUserId] = useState('')
  const [adminToolVisible, setAdminToolVisible] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const toggleAdminTool = () => {
    setAdminToolVisible(!adminToolVisible)
  }

  const setUserAsAdmin = async () => {
    try {
      setStatusMessage('Processing...')
      
      // First get the user by ID or email
      let targetId = userId
      
      // If it looks like an email, look up the user ID
      if (userId.includes('@')) {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', userId)
          .single()
          
        if (error || !data) {
          setStatusMessage(`Error: User not found with email ${userId}`)
          return
        }
        
        targetId = data.id
      }
      
      // Update the user's admin status in the database
      const { error } = await supabase
        .from('users')
        .update({ 
          is_admin: true,
          role: 'admin' 
        })
        .eq('id', targetId)
        
      if (error) {
        setStatusMessage(`Error setting admin status: ${error.message}`)
        return
      }
      
      // Try to set JWT claims (requires service role)
      try {
        // Note: This requires service role permissions
        const { error: claimsError } = await supabase.auth.admin.updateUserById(
          targetId,
          {
            app_metadata: { 
              role: 'admin',
              is_admin: true
            }
          }
        )
        
        if (claimsError) {
          setStatusMessage(`User DB updated but JWT claims failed: ${claimsError.message}. User will need to log out and back in.`)
          return
        }
      } catch (claimsErr: any) {
        setStatusMessage(`User DB updated but JWT update requires server function. User will need to log out and back in.`)
        return
      }
      
      // Force refresh profile if this is the current user
      if (userProfile?.id === targetId) {
        await refreshUserProfile()
      }
      
      setStatusMessage(`Success! User set as admin with full permissions`)
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`)
    }
  }

  const setUserAsAdminServerSide = async () => {
    try {
      setIsProcessing(true)
      setStatusMessage('Processing via server API...')
      
      // First get the user by ID or email
      let targetId = userId
      
      // If it looks like an email, look up the user ID
      if (userId.includes('@')) {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', userId)
          .single()
          
        if (error || !data) {
          setStatusMessage(`Error: User not found with email ${userId}`)
          setIsProcessing(false)
          return
        }
        
        targetId = data.id
      }
      
      // Call the server API endpoint
      const response = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetId,
          adminSecret: 'admin-setup-secret'
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setStatusMessage(`API Error: ${result.error || 'Unknown error'}`)
        if (result.partialSuccess) {
          setStatusMessage(`Partial success: Database updated but JWT claims failed. User needs to log out and back in.`)
        }
      } else {
        setStatusMessage(`Success! User fully set as admin with JWT claims.`)
        
        // Force refresh profile if this is the current user
        if (userProfile?.id === targetId) {
          await refreshUserProfile()
        }
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const dashboardCards = [
    {
      title: "Users",
      description: "Manage user accounts and permissions",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/users",
      color: "bg-blue-100"
    },
    {
      title: "Products",
      description: "Manage products and inventory",
      icon: <PackageOpen className="h-6 w-6" />,
      href: "/admin/products",
      color: "bg-green-100"
    },
    {
      title: "Database",
      description: "View database tables and records",
      icon: <Database className="h-6 w-6" />,
      href: "/admin/database",
      color: "bg-purple-100"
    },
    {
      title: "Settings",
      description: "Configure system settings",
      icon: <Settings className="h-6 w-6" />,
      href: "/admin/settings",
      color: "bg-orange-100"
    }
  ]

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userProfile?.email || "Admin"}
          </p>
        </div>
        
        <Button onClick={toggleAdminTool} variant="outline">
          {adminToolVisible ? 'Hide Admin Tools' : 'Admin Tools'}
        </Button>
      </header>
      
      {adminToolVisible && (
        <Card className="p-4 bg-slate-50 border border-slate-200">
          <h2 className="text-lg font-semibold mb-2">Admin User Management</h2>
          <div className="flex gap-2 mb-2 flex-wrap">
            <Input 
              placeholder="User ID or Email" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="max-w-md"
            />
            <Button 
              onClick={setUserAsAdmin} 
              variant="default"
              disabled={isProcessing || !userId}
            >
              Set as Admin (DB Only)
            </Button>
            <Button 
              onClick={setUserAsAdminServerSide} 
              variant="default"
              disabled={isProcessing || !userId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Set as Admin (Full Access)
            </Button>
          </div>
          {statusMessage && (
            <p className={`text-sm mt-2 ${statusMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {statusMessage}
            </p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card) => (
          <Card key={card.title} className={`p-6 ${card.color}`}>
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                {card.icon}
                <h3 className="font-medium">{card.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {card.description}
              </p>
              <div className="mt-auto">
                <Button asChild variant="ghost" className="flex items-center gap-1 p-0">
                  <Link href={card.href}>
                    Manage
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <section className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline">Add New User</Button>
          <Button variant="outline">Create Product</Button>
          <Button variant="outline">View Reports</Button>
          <Button variant="outline">System Status</Button>
        </div>
      </section>
    </div>
  )
} 