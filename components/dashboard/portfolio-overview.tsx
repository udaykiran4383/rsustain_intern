"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PieChart, Download, Award } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface PortfolioItem {
  project: string
  credits: number
  value: number
  percentage: number
  type: string
  status: string
}

export function PortfolioOverview() {
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Fetch user's transactions to build portfolio
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select(`
            *,
            projects (
              name,
              project_type,
              price_per_credit
            )
          `)
          .eq('buyer_id', user.id)
          .eq('status', 'completed')

        if (error) {
          console.error('Error fetching portfolio:', error)
          setLoading(false)
          return
        }

        // Group transactions by project and calculate portfolio
        const projectMap = new Map()
        let total = 0

        transactions?.forEach((transaction: any) => {
          const project = transaction.projects
          if (!project) return

          const key = project.name
          if (projectMap.has(key)) {
            const existing = projectMap.get(key)
            existing.credits += transaction.credits_purchased
            existing.value += transaction.total_price
          } else {
            projectMap.set(key, {
              project: project.name,
              credits: transaction.credits_purchased,
              value: transaction.total_price,
              type: project.project_type,
              status: 'Active'
            })
          }
          total += transaction.total_price
        })

        // Convert to array and calculate percentages
        const portfolioArray = Array.from(projectMap.values()).map(item => ({
          ...item,
          percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
        }))

        setPortfolioData(portfolioArray)
        setTotalValue(total)
      } catch (error) {
        console.error('Error fetching portfolio:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [user])

  if (loading) {
    return (
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-2 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (portfolioData.length === 0) {
    return (
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400 mb-4">No portfolio data yet</p>
          <p className="text-sm text-gray-500">Start by purchasing carbon credits from the marketplace</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {portfolioData.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{item.project}</h4>
                  <Badge variant={item.status === "Active" ? "default" : "secondary"}>{item.status}</Badge>
                  {item.status === "Retired" && <Award className="h-4 w-4 text-yellow-400" />}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{item.credits} credits</span>
                  <span>${item.value.toLocaleString()}</span>
                  <span>{item.type.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{item.percentage}%</div>
              </div>
            </div>
            <Progress value={item.percentage} className="h-2" />
          </div>
        ))}

        <div className="pt-4 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Portfolio Value</span>
            <span className="text-2xl font-bold text-green-400">${totalValue.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
