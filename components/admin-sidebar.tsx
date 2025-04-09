"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Users, 
  Database, 
  Package
} from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()
  
  const navItems = [
    {
      label: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />
    },
    {
      label: "Cards",
      href: "/admin/cards",
      icon: <Database className="h-5 w-5" />
    },
    {
      label: "Collections",
      href: "/admin/collections",
      icon: <Package className="h-5 w-5" />
    }
  ]

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 min-h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>
      
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
} 