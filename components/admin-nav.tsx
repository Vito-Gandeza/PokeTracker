"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, ShoppingCart, Settings, MessageSquare, Users, Database } from "lucide-react"

export function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Cards",
      href: "/admin/cards",
      icon: Database,
    },
    {
      title: "Collections",
      href: "/admin/collections",
      icon: Package,
    },
    {
      title: "Announcements",
      href: "/admin/announcements",
      icon: MessageSquare,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <nav className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>
      <ul className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
} 