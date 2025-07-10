"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  User, 
  Calendar,
  FileText,
  Filter,
  Search,
  Download,
  RefreshCw,
  MapPin,
  Building,
  DollarSign,
  Leaf,
  Globe,
  Award,
  TrendingUp,
  Users,
  Target,
  Zap
} from "lucide-react"
import { api } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface VerificationItem {
  id: string
  project_id: string
  status: "pending" | "in_review" | "approved" | "rejected" | "revision_requested"
  priority: "low" | "medium" | "high"
  assigned_date?: string
  verifier_id?: string
  comments?: string
  created_at: string
  projects: {
    id: string
    name: string
    description: string
    location: string
    project_type: string
    certification: string
    total_credits: number
    price_per_credit: number
    seller_id: string
    vintage_year: number
    impact_story: string
    sdg_goals: string[]
    status: string
  }
  verifier?: {
    id: string
    full_name: string
    email: string
  }
}

interface VerifierStats {
  total_pending: number
  assigned_to_me: number
  completed_this_month: number
  average_review_time: number
}

export function VerifierQueue() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([])
  const [filteredItems, setFilteredItems] = useState<VerificationItem[]>([])
  const [verifierStats, setVerifierStats] = useState<VerifierStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("queue")

  useEffect(() => {
    if (user) {
      loadVerificationQueue()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [verificationItems, statusFilter, priorityFilter, assignmentFilter, searchQuery])

  const loadVerificationQueue = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load verification queue
      const queue = await api.getVerificationQueue()
      setVerificationItems(queue)

      // Calculate stats
      const stats = calculateStats(queue)
      setVerifierStats(stats)

    } catch (error) {
      console.error("Error loading verification queue:", error)
      toast({
        title: "Error",
        description: "Failed to load verification queue",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshQueue = async () => {
    setRefreshing(true)
    await loadVerificationQueue()
    setRefreshing(false)
    
    toast({
      title: "Queue Refreshed",
      description: "Verification queue has been updated",
    })
  }

  const calculateStats = (items: VerificationItem[]): VerifierStats => {
    const totalPending = items.filter(item => item.status === "pending").length
    const assignedToMe = items.filter(item => item.verifier_id === user?.id).length
    
    // Mock calculation for completed this month and average review time
    const completedThisMonth = Math.floor(Math.random() * 20) + 5
    const averageReviewTime = Math.floor(Math.random() * 10) + 3

    return {
      total_pending: totalPending,
      assigned_to_me: assignedToMe,
      completed_this_month: completedThisMonth,
      average_review_time: averageReviewTime
    }
  }

  const applyFilters = () => {
    let filtered = [...verificationItems]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(item => item.priority === priorityFilter)
    }

    // Assignment filter
    if (assignmentFilter === "assigned_to_me") {
      filtered = filtered.filter(item => item.verifier_id === user?.id)
    } else if (assignmentFilter === "unassigned") {
      filtered = filtered.filter(item => !item.verifier_id)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.projects.name.toLowerCase().includes(query) ||
        item.projects.location.toLowerCase().includes(query) ||
        item.projects.project_type.toLowerCase().includes(query) ||
        item.projects.certification.toLowerCase().includes(query)
      )
    }

    setFilteredItems(filtered)
  }

  const assignToSelf = async (verificationId: string) => {
    if (!user) return

    try {
      await api.assignVerification(verificationId, user.id)
      
      // Update local state
      setVerificationItems(prev => 
        prev.map(item => 
          item.id === verificationId 
            ? { ...item, verifier_id: user.id, status: "in_review", assigned_date: new Date().toISOString() }
            : item
        )
      )

      // Log activity
      await api.logActivity({
        user_id: user.id,
        activity_type: "verification_assigned",
        description: `Assigned verification task to self`,
        metadata: { verification_id: verificationId }
      })

      toast({
        title: "Assignment Successful",
        description: "Verification task has been assigned to you",
      })
    } catch (error) {
      console.error("Error assigning verification:", error)
      toast({
        title: "Assignment Failed",
        description: "Failed to assign verification task",
        variant: "destructive",
      })
    }
  }

  const updatePriority = async (verificationId: string, priority: "low" | "medium" | "high") => {
    try {
      await api.updateVerificationPriority(verificationId, priority)
      
      // Update local state
      setVerificationItems(prev => 
        prev.map(item => 
          item.id === verificationId 
            ? { ...item, priority }
            : item
        )
      )

      toast({
        title: "Priority Updated",
        description: `Priority set to ${priority}`,
      })
    } catch (error) {
      console.error("Error updating priority:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update priority",
        variant: "destructive",
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600'
      case 'in_review': return 'bg-blue-600'
      case 'approved': return 'bg-green-600'
      case 'rejected': return 'bg-red-600'
      case 'revision_requested': return 'bg-orange-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'in_review': return <Eye className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <AlertTriangle className="h-4 w-4" />
      case 'revision_requested': return <RefreshCw className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold">Verification Queue</h1>
          <p className="text-gray-400">Review and verify carbon credit projects</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshQueue}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {verifierStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {verifierStats.total_pending}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-gray-400">Awaiting verification</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Assigned to Me</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {verifierStats.assigned_to_me}
                  </p>
                </div>
                <User className="h-8 w-8 text-blue-400" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-gray-400">Active assignments</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed This Month</p>
                  <p className="text-2xl font-bold text-green-400">
                    {verifierStats.completed_this_month}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-green-400">+15%</span>
                <span className="text-gray-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg. Review Time</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {verifierStats.average_review_time}d
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-400" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-gray-400">Target: 5 days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="glass-card border-white/20">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass border-white/20 w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="glass border-white/20 w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="glass border-white/20 w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger className="glass border-white/20 w-40">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="assigned_to_me">Assigned to Me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Verification Queue */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Verification Queue</TabsTrigger>
          <TabsTrigger value="my_assignments">My Assignments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Pending Verification ({filteredItems.length})
            </h2>
          </div>

          <div className="grid gap-4">
            {filteredItems.length === 0 ? (
              <Card className="glass-card border-white/20">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
                  <p className="text-gray-400">
                    No projects match your current filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item) => (
                <Card key={item.id} className="glass-card border-white/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{item.projects.name}</h3>
                          <Badge className={`${getStatusColor(item.status)} text-white`}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1">{item.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={`${getPriorityColor(item.priority)} text-white`}>
                            {item.priority} priority
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {item.projects.project_type.replace('_', ' ')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {item.projects.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {item.projects.certification}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {item.projects.description}
                        </p>

                        {item.verifier && (
                          <div className="flex items-center gap-2 text-sm text-blue-400">
                            <User className="h-4 w-4" />
                            Assigned to: {item.verifier.full_name}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link href={`/verifier/review/${item.id}`}>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </Link>
                        
                        {!item.verifier_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => assignToSelf(item.id)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Assign to Me
                          </Button>
                        )}

                        <Select
                          value={item.priority}
                          onValueChange={(priority) => updatePriority(item.id, priority as any)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 glass-strong rounded-lg">
                        <div className="text-xl font-bold text-green-400">
                          {item.projects.total_credits.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">Total Credits</div>
                      </div>
                      <div className="text-center p-3 glass-strong rounded-lg">
                        <div className="text-xl font-bold text-blue-400">
                          ${item.projects.price_per_credit}
                        </div>
                        <div className="text-xs text-gray-400">Price per Credit</div>
                      </div>
                      <div className="text-center p-3 glass-strong rounded-lg">
                        <div className="text-xl font-bold text-purple-400">
                          {item.projects.vintage_year}
                        </div>
                        <div className="text-xs text-gray-400">Vintage Year</div>
                      </div>
                      <div className="text-center p-3 glass-strong rounded-lg">
                        <div className="text-xl font-bold text-orange-400">
                          {item.projects.sdg_goals?.length || 0}
                        </div>
                        <div className="text-xs text-gray-400">SDG Goals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my_assignments" className="space-y-4">
          <h2 className="text-xl font-semibold">My Assignments</h2>
          <div className="text-center py-8">
            <p className="text-gray-400">Your assigned verification tasks will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <h2 className="text-xl font-semibold">Completed Verifications</h2>
          <div className="text-center py-8">
            <p className="text-gray-400">Your completed verification tasks will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 