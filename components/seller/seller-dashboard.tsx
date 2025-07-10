"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Users, 
  FileText, 
  Plus,
  Eye,
  Edit,
  Download,
  BarChart3,
  Calendar,
  Globe,
  AlertCircle,
  CheckCircle,
  Clock,
  Leaf,
  Building
} from "lucide-react"
import { api } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

interface Project {
  id: string
  name: string
  project_type: string
  location: string
  status: string
  verification_status: string
  total_credits: number
  available_credits: number
  sold_credits: number
  price_per_credit: number
  revenue_generated: number
  created_at: string
  certification: string
}

interface SalesData {
  total_revenue: number
  total_credits_sold: number
  active_projects: number
  pending_verification: number
  average_price: number
  monthly_revenue: Array<{ month: string; revenue: number; credits: number }>
}

interface RecentActivity {
  id: string
  type: string
  description: string
  created_at: string
  metadata?: any
}

export function SellerDashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load seller projects
      const sellerProjects = await api.getSellerProjects(user.id)
      setProjects(sellerProjects)

      // Calculate sales data
      const salesData = calculateSalesData(sellerProjects)
      setSalesData(salesData)

      // Load recent activity
      const activity = await api.getUserActivity(user.id, 10)
      setRecentActivity(activity)

    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSalesData = (projects: Project[]): SalesData => {
    const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue_generated || 0), 0)
    const totalCreditsSold = projects.reduce((sum, p) => sum + (p.sold_credits || 0), 0)
    const activeProjects = projects.filter(p => p.status === 'active').length
    const pendingVerification = projects.filter(p => p.verification_status === 'pending').length
    const averagePrice = totalCreditsSold > 0 ? totalRevenue / totalCreditsSold : 0

    // Generate mock monthly data
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        revenue: Math.random() * 50000 + 10000,
        credits: Math.random() * 1000 + 200
      }
    }).reverse()

    return {
      total_revenue: totalRevenue,
      total_credits_sold: totalCreditsSold,
      active_projects: activeProjects,
      pending_verification: pendingVerification,
      average_price: averagePrice,
      monthly_revenue: monthlyRevenue
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600'
      case 'pending_verification': return 'bg-yellow-600'
      case 'draft': return 'bg-gray-600'
      case 'rejected': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-400" />
      default: return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-400">Manage your carbon credit projects and track performance</p>
        </div>
        <Link href="/seller/register-project">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      {salesData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${salesData.total_revenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-green-400">+12.5%</span>
                <span className="text-gray-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Credits Sold</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {salesData.total_credits_sold.toLocaleString()}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-400" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-green-400">+8.2%</span>
                <span className="text-gray-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Projects</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {salesData.active_projects}
                  </p>
                </div>
                <Building className="h-8 w-8 text-purple-400" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-gray-400">
                  {salesData.pending_verification} pending verification
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg. Price</p>
                  <p className="text-2xl font-bold text-orange-400">
                    ${salesData.average_price.toFixed(2)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-400" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-gray-400">per carbon credit</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Project Portfolio</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {projects.length === 0 ? (
              <Card className="glass-card border-white/20">
                <CardContent className="p-12 text-center">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
                  <p className="text-gray-400 mb-4">
                    Start by registering your first carbon credit project
                  </p>
                  <Link href="/seller/register-project">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Register Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <Card key={project.id} className="glass-card border-white/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{project.name}</h3>
                          <Badge className={`${getStatusColor(project.status)} text-white`}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                          {getVerificationStatusIcon(project.verification_status)}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          {project.project_type.replace('_', ' ')} • {project.location}
                        </p>
                        <p className="text-sm text-gray-400">
                          {project.certification} • Created {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 glass-strong rounded-lg">
                        <div className="text-xl font-bold text-green-400">
                          {project.total_credits.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">Total Credits</div>
                      </div>
                      <div className="text-center p-3 glass-strong rounded-lg">
                        <div className="text-xl font-bold text-blue-400">
                          {project.available_credits.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">Available</div>
                      </div>
                      <div className="text-center p-3 glass-strong rounded-lg">
                        <div className="text-xl font-bold text-purple-400">
                          {(project.sold_credits || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">Sold</div>
                      </div>
                      <div className="text-center p-3 glass-strong rounded-lg">
                        <div className="text-xl font-bold text-orange-400">
                          ${(project.revenue_generated || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">Revenue</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Price: ${project.price_per_credit}/credit
                        </span>
                        <span className="text-gray-400">
                          Progress: {Math.round(((project.sold_credits || 0) / project.total_credits) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${Math.min(((project.sold_credits || 0) / project.total_credits) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Sales Analytics Tab */}
        <TabsContent value="sales" className="space-y-4">
          <h2 className="text-xl font-semibold">Sales Performance</h2>
          
          {salesData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle>Monthly Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesData.monthly_revenue.map((month, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">{month.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm">${month.revenue.toLocaleString()}</span>
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(month.revenue / 60000) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle>Credits Sold by Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salesData.monthly_revenue.map((month, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">{month.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm">{Math.round(month.credits).toLocaleString()}</span>
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(month.credits / 1200) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          
          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 glass-strong rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-semibold">Seller Settings</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Organization Name</label>
                  <input 
                    type="text" 
                    className="w-full p-3 glass border border-white/20 rounded-lg"
                    placeholder="Your Organization"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Business Registration</label>
                  <input 
                    type="text" 
                    className="w-full p-3 glass border border-white/20 rounded-lg"
                    placeholder="Registration Number"
                  />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Project Updates</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sales Notifications</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Verification Updates</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 