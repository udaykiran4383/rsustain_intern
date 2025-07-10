"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, ExternalLink } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface Transaction {
  id: string
  type: string
  project: string
  credits: number
  amount: number
  status: string
  date: string
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id,
            credits_purchased,
            total_price,
            status,
            created_at,
            projects (name)
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) {
          console.error('Error fetching transactions:', error)
          setLoading(false)
          return
        }

        const formattedTransactions = data?.map((transaction: any) => ({
          id: transaction.id,
          type: 'Purchase',
          project: transaction.projects?.name || 'Unknown Project',
          credits: transaction.credits_purchased,
          amount: transaction.total_price,
          status: transaction.status === 'completed' ? 'Completed' : 'Pending',
          date: new Date(transaction.created_at).toLocaleDateString()
        })) || []

        setTransactions(formattedTransactions)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user])

  if (loading) {
    return (
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 glass rounded-lg">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 mb-2">No transactions yet</p>
            <p className="text-sm text-gray-500">Your recent purchases will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 glass rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{transaction.project}</span>
                    <Badge variant={transaction.type === "Purchase" ? "default" : "secondary"}>{transaction.type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{transaction.credits} credits</span>
                    <span>${transaction.amount}</span>
                    <span>{transaction.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={transaction.status === "Completed" ? "default" : "outline"}>{transaction.status}</Badge>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
