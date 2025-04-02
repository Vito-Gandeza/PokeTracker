"use client"

import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  const { userProfile } = useAuth()

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
      <header>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {userProfile?.email || "Admin"}
        </p>
      </header>

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