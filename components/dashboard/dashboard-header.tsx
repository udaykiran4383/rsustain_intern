"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Settings, Download } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function DashboardHeader() {
  const { user, userProfile } = useAuth()

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "buyer":
        return "bg-blue-600"
      case "seller":
        return "bg-green-600"
      case "verifier":
        return "bg-purple-600"
      case "admin":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {userProfile?.company_name || user?.email?.split("@")[0] || "User"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getRoleBadgeColor(userProfile?.role)}>
                {userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) || "User"}
              </Badge>
              {userProfile?.country && <span className="text-sm text-gray-400">📍 {userProfile.country}</span>}
              <span className="text-sm text-gray-400">Member since 2024</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
