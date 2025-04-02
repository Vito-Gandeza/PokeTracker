import type { ReactNode } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
        <SiteFooter />
      </div>
    </ProtectedRoute>
  )
} 