"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Calendar, 
  ShoppingCart, 
  Download, 
  Eye, 
  Filter,
  CreditCard,
  Leaf,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  DollarSign
} from "lucide-react"
import { api, type Transaction } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

export function PurchaseHistory() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date-desc")

  const [summary, setSummary] = useState({
    totalPurchases: 0,
    totalCredits: 0,
    totalSpent: 0,
    averagePrice: 0
  })

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, statusFilter, dateFilter])

  const fetchTransactions = async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          projects (
            name,
            project_type,
            certification,
            location,
            vintage_year
          )
        `)
        .eq('buyer_id', user.id)

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter)
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date()
        let dateThreshold: Date
        
        switch (dateFilter) {
          case "week":
            dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case "month":
            dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case "quarter":
            dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          case "year":
            dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          default:
            dateThreshold = new Date(0)
        }
        
        query = query.gte('created_at', dateThreshold.toISOString())
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching transactions:', error)
        toast({
          title: "Error",
          description: "Failed to load purchase history.",
          variant: "destructive",
        })
        return
      }

      setTransactions(data || [])
      calculateSummary(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (transactionData: Transaction[]) => {
    const completedTransactions = transactionData.filter(t => t.status === 'completed')
    
    const totalPurchases = completedTransactions.length
    const totalCredits = completedTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const totalSpent = completedTransactions.reduce((sum, t) => sum + t.total_amount, 0)
    const averagePrice = totalCredits > 0 ? totalSpent / totalCredits : 0

    setSummary({
      totalPurchases,
      totalCredits,
      totalSpent,
      averagePrice
    })
  }

  const downloadReceipt = async (transaction: Transaction) => {
    try {
      // In a real implementation, this would generate or fetch a receipt PDF
      const receiptData = {
        transaction_id: transaction.id,
        date: transaction.created_at,
        project: transaction.projects?.name,
        quantity: transaction.quantity,
        price_per_credit: transaction.price_per_credit,
        total: transaction.total_amount,
        status: transaction.status
      }

      // For now, create a simple receipt URL
      const receiptUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(
        `RECEIPT - Rsustain Carbon Exchange\n` +
        `Transaction ID: ${transaction.id}\n` +
        `Date: ${new Date(transaction.created_at).toLocaleDateString()}\n` +
        `Project: ${transaction.projects?.name}\n` +
        `Quantity: ${transaction.quantity} credits\n` +
        `Price per credit: $${transaction.price_per_credit}\n` +
        `Total: $${transaction.total_amount}\n` +
        `Status: ${transaction.status}`
      )}`

      const link = document.createElement('a')
      link.href = receiptUrl
      link.download = `receipt-${transaction.id.slice(0, 8)}.txt`
      link.click()

      // Log activity
      await api.logActivity({
        user_id: user!.id,
        activity_type: "receipt_downloaded",
        description: `Downloaded receipt for transaction ${transaction.id.slice(0, 8)}`,
        metadata: {
          transaction_id: transaction.id
        }
      })

      toast({
        title: "Receipt Downloaded",
        description: "Your receipt has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error downloading receipt:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600"
      case "pending":
        return "bg-yellow-600"
      case "failed":
        return "bg-red-600"
      case "cancelled":
        return "bg-gray-600"
      default:
        return "bg-gray-600"
    }
  }

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case "stripe":
        return <CreditCard className="h-4 w-4" />
      case "bank_transfer":
        return <TrendingUp className="h-4 w-4" />
      case "corporate_account":
        return <DollarSign className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = searchTerm === "" || 
        transaction.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "amount-desc":
          return b.total_amount - a.total_amount
        case "amount-asc":
          return a.total_amount - b.total_amount
        case "quantity-desc":
          return b.quantity - a.quantity
        case "quantity-asc":
          return a.quantity - b.quantity
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-12 bg-gray-700 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Purchase History</h2>
          <p className="text-gray-400">View and manage your carbon credit transactions</p>
        </div>
        <Button onClick={fetchTransactions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Purchases</p>
                <p className="text-2xl font-bold text-green-400">{summary.totalPurchases}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Credits Purchased</p>
                <p className="text-2xl font-bold text-blue-400">{summary.totalCredits.toLocaleString()}</p>
              </div>
              <Leaf className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-purple-400">${summary.totalSpent.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg. Price/Credit</p>
                <p className="text-2xl font-bold text-orange-400">${summary.averagePrice.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-white/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 glass border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48 glass border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 glass border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                <SelectItem value="quantity-desc">Most Credits</SelectItem>
                <SelectItem value="quantity-asc">Least Credits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <Card className="glass-card border-white/20 text-center p-12">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
          <p className="text-gray-400">
            {transactions.length === 0 
              ? "You haven't made any purchases yet. Start browsing projects to make your first purchase."
              : "No transactions match your current filters."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="glass-card border-white/20 hover:border-green-500/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{transaction.projects?.name}</h3>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4" />
                        {transaction.quantity} credits
                      </div>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(transaction.payment_method)}
                        {transaction.payment_method?.replace('_', ' ') || 'Credit Card'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {transaction.projects?.project_type?.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {transaction.projects?.certification}
                      </Badge>
                      {transaction.projects?.vintage_year && (
                        <Badge variant="outline" className="text-xs">
                          Vintage {transaction.projects.vintage_year}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-green-400">
                      ${transaction.total_amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">
                      ${transaction.price_per_credit}/credit
                    </div>
                    
                    <div className="flex gap-2">
                      {transaction.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReceipt(transaction)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/transactions/${transaction.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>

                {transaction.projects?.location && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                      📍 {transaction.projects.location}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More (if needed) */}
      {filteredTransactions.length > 0 && filteredTransactions.length % 20 === 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={fetchTransactions}>
            Load More Transactions
          </Button>
        </div>
      )}
    </div>
  )
} 