"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Leaf, DollarSign } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface Stat {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: any
  color: string
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Fetch user's transactions
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('credits_purchased, total_price, status, created_at')
          .eq('buyer_id', user.id)

        if (error) {
          console.error('Error fetching stats:', error)
          setLoading(false)
          return
        }

        const completedTransactions = transactions?.filter(t => t.status === 'completed') || []
        
        // Calculate stats
        const totalCredits = completedTransactions.reduce((sum, t) => sum + t.credits_purchased, 0)
        const portfolioValue = completedTransactions.reduce((sum, t) => sum + t.total_price, 0)
        const creditsRetired = Math.floor(totalCredits * 0.3) // Assuming 30% retired for demo
        const carbonOffset = (totalCredits * 0.85).toFixed(1) // Assuming 0.85 tCO2 per credit

        const statsData: Stat[] = [
          {
            title: "Total Credits Owned",
            value: totalCredits.toLocaleString(),
            change: "+12.5%",
            trend: "up",
            icon: Leaf,
            color: "text-green-400",
          },
          {
            title: "Portfolio Value",
            value: `$${portfolioValue.toLocaleString()}`,
            change: "+8.2%",
            trend: "up",
            icon: DollarSign,
            color: "text-blue-400",
          },
          {
            title: "Credits Retired",
            value: creditsRetired.toLocaleString(),
            change: "+5.1%",
            trend: "up",
            icon: TrendingUp,
            color: "text-purple-400",
          },
          {
            title: "Carbon Offset",
            value: `${carbonOffset}t CO₂`,
            change: "+15.3%",
            trend: "up",
            icon: TrendingDown,
            color: "text-orange-400",
          },
        ]

        setStats(statsData)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-8 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="glass-card border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <span className={`text-sm ${stat.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <stat.icon className={`h-12 w-12 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
