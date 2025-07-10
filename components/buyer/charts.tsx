"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Leaf, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  Download,
  RefreshCw,
  Target,
  Globe
} from "lucide-react"
import { api, type Transaction } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface ChartData {
  monthlyPurchases: Array<{
    month: string
    credits: number
    amount: number
    transactions: number
  }>
  projectTypeDistribution: Array<{
    name: string
    value: number
    percentage: number
    color: string
  }>
  certificationBreakdown: Array<{
    name: string
    value: number
    percentage: number
    color: string
  }>
  priceAnalysis: Array<{
    date: string
    averagePrice: number
    totalSpent: number
  }>
  impactMetrics: {
    totalCredits: number
    co2Offset: number
    equivalentTrees: number
    equivalentCars: number
  }
  performance: {
    totalInvestment: number
    currentValue: number
    roi: number
    riskScore: number
  }
}

export function Charts() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [chartData, setChartData] = useState<ChartData>({
    monthlyPurchases: [],
    projectTypeDistribution: [],
    certificationBreakdown: [],
    priceAnalysis: [],
    impactMetrics: {
      totalCredits: 0,
      co2Offset: 0,
      equivalentTrees: 0,
      equivalentCars: 0
    },
    performance: {
      totalInvestment: 0,
      currentValue: 0,
      roi: 0,
      riskScore: 0
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("12months")
  const [activeTab, setActiveTab] = useState("portfolio")

  const colors = {
    primary: "#10b981",
    secondary: "#3b82f6", 
    accent: "#8b5cf6",
    warning: "#f59e0b",
    danger: "#ef4444",
    chartColors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"]
  }

  useEffect(() => {
    if (user) {
      fetchChartData()
    }
  }, [user, timeRange])

  const fetchChartData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Calculate date range
      const now = new Date()
      let startDate: Date
      
      switch (timeRange) {
        case "3months":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case "6months":
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case "12months":
        default:
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
      }

      // Fetch transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          projects (
            name,
            project_type,
            certification,
            risk_score
          )
        `)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching chart data:', error)
        return
      }

      const processedData = processTransactionData(transactions || [])
      setChartData(processedData)

    } catch (error) {
      console.error("Error fetching chart data:", error)
      toast({
        title: "Error",
        description: "Failed to load chart data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processTransactionData = (transactions: any[]): ChartData => {
    // Monthly purchases analysis
    const monthlyData = new Map()
    transactions.forEach(tx => {
      const month = new Date(tx.created_at).toLocaleString('default', { month: 'short', year: 'numeric' })
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { month, credits: 0, amount: 0, transactions: 0 })
      }
      const data = monthlyData.get(month)
      data.credits += tx.quantity
      data.amount += tx.total_amount
      data.transactions += 1
    })

    // Project type distribution
    const projectTypeMap = new Map()
    transactions.forEach(tx => {
      const type = tx.projects?.project_type || 'Unknown'
      projectTypeMap.set(type, (projectTypeMap.get(type) || 0) + tx.quantity)
    })

    const totalCredits = transactions.reduce((sum, tx) => sum + tx.quantity, 0)
    const projectTypeDistribution = Array.from(projectTypeMap.entries()).map(([name, value], index) => ({
      name: name.replace('_', ' '),
      value,
      percentage: Math.round((value / totalCredits) * 100),
      color: colors.chartColors[index % colors.chartColors.length]
    }))

    // Certification breakdown
    const certificationMap = new Map()
    transactions.forEach(tx => {
      const cert = tx.projects?.certification || 'Unknown'
      certificationMap.set(cert, (certificationMap.get(cert) || 0) + tx.quantity)
    })

    const certificationBreakdown = Array.from(certificationMap.entries()).map(([name, value], index) => ({
      name,
      value,
      percentage: Math.round((value / totalCredits) * 100),
      color: colors.chartColors[index % colors.chartColors.length]
    }))

    // Price analysis over time
    const priceAnalysis = Array.from(monthlyData.values()).map(item => ({
      date: item.month,
      averagePrice: item.credits > 0 ? Number((item.amount / item.credits).toFixed(2)) : 0,
      totalSpent: item.amount
    }))

    // Impact metrics
    const co2Offset = totalCredits * 0.85 // Assuming 0.85 tCO2 per credit
    const equivalentTrees = Math.round(co2Offset * 40) // ~40 trees per tCO2
    const equivalentCars = Math.round(co2Offset / 4.6) // ~4.6 tCO2 per car annually

    // Performance metrics
    const totalInvestment = transactions.reduce((sum, tx) => sum + tx.total_amount, 0)
    const averageRiskScore = transactions.reduce((sum, tx) => sum + (tx.projects?.risk_score || 5), 0) / transactions.length
    const currentValue = totalInvestment * 1.05 // Simulate 5% appreciation
    const roi = totalInvestment > 0 ? ((currentValue - totalInvestment) / totalInvestment) * 100 : 0

    return {
      monthlyPurchases: Array.from(monthlyData.values()),
      projectTypeDistribution,
      certificationBreakdown,
      priceAnalysis,
      impactMetrics: {
        totalCredits,
        co2Offset: Number(co2Offset.toFixed(1)),
        equivalentTrees,
        equivalentCars
      },
      performance: {
        totalInvestment,
        currentValue,
        roi: Number(roi.toFixed(2)),
        riskScore: Number(averageRiskScore.toFixed(1))
      }
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(chartData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `carbon-credits-analytics-${timeRange}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Data Exported",
      description: "Your analytics data has been exported successfully.",
    })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card border-white/20 p-3 shadow-lg">
          <p className="font-medium text-white">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }}>
              {item.name}: {typeof item.value === 'number' && item.name?.includes('$') 
                ? `$${item.value.toFixed(2)}` 
                : item.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

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
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
          <p className="text-gray-400">Insights into your carbon credit portfolio and trading activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48 glass border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchChartData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Investment</p>
                <p className="text-2xl font-bold text-green-400">
                  ${chartData.performance.totalInvestment.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  ROI: {chartData.performance.roi}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Credits Owned</p>
                <p className="text-2xl font-bold text-blue-400">
                  {chartData.impactMetrics.totalCredits.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  Avg risk: {chartData.performance.riskScore}/10
                </p>
              </div>
              <Leaf className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">CO₂ Offset</p>
                <p className="text-2xl font-bold text-purple-400">
                  {chartData.impactMetrics.co2Offset}t
                </p>
                <p className="text-xs text-gray-400">
                  ≈ {chartData.impactMetrics.equivalentTrees} trees
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Portfolio Value</p>
                <p className="text-2xl font-bold text-orange-400">
                  ${chartData.performance.currentValue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  {chartData.performance.roi >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  {Math.abs(chartData.performance.roi)}%
                </p>
              </div>
              <Globe className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Portfolio Analysis */}
        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Project Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.projectTypeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {chartData.projectTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Certification Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.certificationBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill={colors.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Portfolio Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.projectTypeDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass-strong rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.value} credits</div>
                      <div className="text-sm text-gray-400">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Analysis */}
        <TabsContent value="purchases" className="space-y-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Purchase Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.monthlyPurchases}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis yAxisId="left" stroke="#9ca3af" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="credits" fill={colors.primary} name="Credits Purchased" />
                  <Bar yAxisId="right" dataKey="amount" fill={colors.secondary} name="Amount Spent ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Average Price Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.priceAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="averagePrice" 
                    stroke={colors.accent} 
                    strokeWidth={2}
                    name="Avg Price per Credit ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environmental Impact */}
        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card border-white/20">
              <CardContent className="p-6 text-center">
                <Leaf className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">CO₂ Offset</h3>
                <p className="text-3xl font-bold text-green-400 mb-2">
                  {chartData.impactMetrics.co2Offset}t
                </p>
                <p className="text-sm text-gray-400">Total carbon dioxide equivalent</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tree Equivalent</h3>
                <p className="text-3xl font-bold text-blue-400 mb-2">
                  {chartData.impactMetrics.equivalentTrees.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">Trees planted equivalent</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cars Off Road</h3>
                <p className="text-3xl font-bold text-purple-400 mb-2">
                  {chartData.impactMetrics.equivalentCars}
                </p>
                <p className="text-sm text-gray-400">Cars removed for 1 year</p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Environmental Impact Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.monthlyPurchases}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="credits" 
                    stroke={colors.primary} 
                    fill={colors.primary}
                    fillOpacity={0.3}
                    name="Cumulative Credits"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Investment Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Investment</span>
                  <span className="font-semibold">${chartData.performance.totalInvestment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Value</span>
                  <span className="font-semibold">${chartData.performance.currentValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">ROI</span>
                  <Badge variant={chartData.performance.roi >= 0 ? "default" : "destructive"}>
                    {chartData.performance.roi >= 0 ? '+' : ''}{chartData.performance.roi}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Risk Score</span>
                  <Badge variant="outline">
                    {chartData.performance.riskScore}/10
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData.certificationBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.certificationBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Investment Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.priceAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="totalSpent" 
                    stroke={colors.secondary} 
                    fill={colors.secondary}
                    fillOpacity={0.3}
                    name="Cumulative Investment ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 