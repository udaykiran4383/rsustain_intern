"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Download, 
  Eye,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Award,
  Users,
  Leaf,
  Globe,
  Target,
  Zap,
  Clock,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Search,
  Filter
} from "lucide-react"
import { api } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ProjectReviewProps {
  verificationId: string
}

interface VerificationData {
  id: string
  project_id: string
  status: string
  priority: string
  comments?: string
  findings?: string
  created_at: string
  projects: {
    id: string
    name: string
    description: string
    location: string
    project_type: string
    certification: string
    total_credits: number
    available_credits: number
    price_per_credit: number
    vintage_year: number
    impact_story: string
    sdg_goals: string[]
    co_benefits: string[]
    additionality_proof: string
    monitoring_plan: string
    risk_mitigation: string
    methodology: string
    project_documents: Array<{
      id: string
      document_name: string
      document_type: string
      file_url: string
      status: string
    }>
  }
}

interface ReviewDecision {
  status: "approved" | "rejected" | "revision_requested"
  comments: string
  findings: string
  decision_reason: string
}

export function ProjectReview({ verificationId }: ProjectReviewProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>({
    status: "approved",
    comments: "",
    findings: "",
    decision_reason: ""
  })
  const [activeTab, setActiveTab] = useState("overview")

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [runningAiAnalysis, setRunningAiAnalysis] = useState(false)

  useEffect(() => {
    loadVerificationData()
  }, [verificationId])

  const loadVerificationData = async () => {
    try {
      setLoading(true)
      const data = await api.getVerificationDetails(verificationId)
      setVerificationData(data)
    } catch (error) {
      console.error("Error loading verification data:", error)
      toast({
        title: "Error",
        description: "Failed to load verification data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const runAIAnalysis = async () => {
    if (!verificationData) return

    setRunningAiAnalysis(true)
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockAnalysis = {
        overall_score: 0.85,
        environmental_impact: 0.9,
        additionality: 0.8,
        permanence: 0.85,
        monitoring_quality: 0.9,
        documentation_completeness: 0.88,
        risk_factors: [
          { type: "Low", description: "Strong monitoring methodology" },
          { type: "Medium", description: "Some additionality concerns in baseline scenario" }
        ],
        recommendations: [
          "Verify baseline calculations with independent source",
          "Request additional monitoring reports for year 2",
          "Confirm stakeholder consultation documentation"
        ],
        confidence_level: "High"
      }
      
      setAiAnalysis(mockAnalysis)
      
      toast({
        title: "AI Analysis Complete",
        description: "Comprehensive project analysis has been generated",
      })
    } catch (error) {
      console.error("Error running AI analysis:", error)
      toast({
        title: "Analysis Failed",
        description: "Failed to run AI analysis",
        variant: "destructive",
      })
    } finally {
      setRunningAiAnalysis(false)
    }
  }

  const submitReview = async () => {
    if (!verificationData || !user) return

    if (!reviewDecision.comments.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide review comments",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      // Update verification status
      await api.updateVerificationStatus(verificationId, reviewDecision.status, {
        comments: reviewDecision.comments,
        findings: reviewDecision.findings,
        decision_reason: reviewDecision.decision_reason
      })

      // Update project status based on verification decision
      const projectStatus = reviewDecision.status === "approved" ? "active" : 
                           reviewDecision.status === "rejected" ? "rejected" : "pending_verification"
      
      await api.updateProject(verificationData.project_id, {
        status: projectStatus,
        verification_status: reviewDecision.status
      })

      // Log activity
      await api.logActivity({
        user_id: user.id,
        activity_type: "verification_completed",
        description: `Completed verification for project: ${verificationData.projects.name}`,
        metadata: {
          verification_id: verificationId,
          decision: reviewDecision.status,
          project_id: verificationData.project_id
        }
      })

      toast({
        title: "Review Submitted",
        description: `Verification ${reviewDecision.status} successfully`,
      })

      // Redirect back to queue
      router.push("/verifier/queue")
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit review",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600'
      case 'rejected': return 'bg-red-600'
      case 'revision_requested': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!verificationData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Verification Not Found</h2>
        <p className="text-gray-400">The requested verification could not be found.</p>
      </div>
    )
  }

  const project = verificationData.projects

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <div className="flex items-center gap-4 text-gray-400">
            <div className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              {project.project_type.replace('_', ' ')}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {project.location}
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              {project.certification}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Vintage {project.vintage_year}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runAIAnalysis}
            disabled={runningAiAnalysis}
          >
            {runningAiAnalysis ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                AI Quick Verify
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => router.push("/verifier/queue")}>
            Back to Queue
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-400">
              {project.total_credits.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Credits</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-400">
              ${project.price_per_credit}
            </div>
            <div className="text-sm text-gray-400">Price per Credit</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {project.sdg_goals?.length || 0}
            </div>
            <div className="text-sm text-gray-400">SDG Goals</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/20">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-400">
              ${(project.total_credits * project.price_per_credit).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              AI Verification Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 glass-strong rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {Math.round(aiAnalysis.overall_score * 100)}%
                </div>
                <div className="text-sm text-gray-400">Overall Score</div>
              </div>
              <div className="text-center p-4 glass-strong rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(aiAnalysis.environmental_impact * 100)}%
                </div>
                <div className="text-sm text-gray-400">Environmental Impact</div>
              </div>
              <div className="text-center p-4 glass-strong rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {aiAnalysis.confidence_level}
                </div>
                <div className="text-sm text-gray-400">Confidence Level</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Key Recommendations:</h4>
              <ul className="space-y-1">
                {aiAnalysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Review Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="decision">Decision</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">{project.description}</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Impact Story</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">{project.impact_story}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>SDG Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.sdg_goals?.map(goal => (
                    <Badge key={goal} variant="outline" className="text-xs">{goal}</Badge>
                  )) || <p className="text-gray-400">No SDG goals specified</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Co-Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.co_benefits?.map(benefit => (
                    <Badge key={benefit} variant="outline" className="text-xs">{benefit}</Badge>
                  )) || <p className="text-gray-400">No co-benefits specified</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Project Documents ({project.project_documents?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {project.project_documents && project.project_documents.length > 0 ? (
                <div className="space-y-3">
                  {project.project_documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 glass-strong rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="font-medium">{doc.document_name}</p>
                          <p className="text-sm text-gray-400">{doc.document_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={doc.status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'}>
                          {doc.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No documents uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Methodology Tab */}
        <TabsContent value="methodology" className="space-y-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Additionality Proof</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                {project.additionality_proof || "No additionality proof provided"}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Monitoring Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                {project.monitoring_plan || "No monitoring plan provided"}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Risk Mitigation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                {project.risk_mitigation || "No risk mitigation strategy provided"}
              </p>
            </CardContent>
          </Card>

          {project.methodology && (
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Methodology</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">{project.methodology}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>CO₂ Equivalent Reduction</span>
                  <span className="font-bold text-green-400">
                    {(project.total_credits * 0.85).toFixed(1)}t
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trees Equivalent</span>
                  <span className="font-bold text-green-400">
                    {Math.round(project.total_credits * 0.85 * 40).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cars Off Road (1 year)</span>
                  <span className="font-bold text-green-400">
                    {Math.round(project.total_credits * 0.85 / 4.6).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Economic Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Project Value</span>
                  <span className="font-bold text-blue-400">
                    ${(project.total_credits * project.price_per_credit).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Revenue per Ton CO₂</span>
                  <span className="font-bold text-blue-400">
                    ${(project.price_per_credit / 0.85).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Market Premium</span>
                  <span className="font-bold text-blue-400">
                    {((project.price_per_credit - 20) / 20 * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Decision Tab */}
        <TabsContent value="decision" className="space-y-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle>Verification Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Decision</label>
                <div className="flex gap-2">
                  <Button
                    variant={reviewDecision.status === "approved" ? "default" : "outline"}
                    onClick={() => setReviewDecision(prev => ({ ...prev, status: "approved" }))}
                    className={reviewDecision.status === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant={reviewDecision.status === "rejected" ? "default" : "outline"}
                    onClick={() => setReviewDecision(prev => ({ ...prev, status: "rejected" }))}
                    className={reviewDecision.status === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant={reviewDecision.status === "revision_requested" ? "default" : "outline"}
                    onClick={() => setReviewDecision(prev => ({ ...prev, status: "revision_requested" }))}
                    className={reviewDecision.status === "revision_requested" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Request Revision
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Comments *</label>
                <Textarea
                  value={reviewDecision.comments}
                  onChange={(e) => setReviewDecision(prev => ({ ...prev, comments: e.target.value }))}
                  className="glass border-white/20"
                  placeholder="Provide detailed comments about your verification decision..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Key Findings</label>
                <Textarea
                  value={reviewDecision.findings}
                  onChange={(e) => setReviewDecision(prev => ({ ...prev, findings: e.target.value }))}
                  className="glass border-white/20"
                  placeholder="Summarize key findings from your review..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Decision Rationale</label>
                <Textarea
                  value={reviewDecision.decision_reason}
                  onChange={(e) => setReviewDecision(prev => ({ ...prev, decision_reason: e.target.value }))}
                  className="glass border-white/20"
                  placeholder="Explain the reasoning behind your decision..."
                  rows={3}
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This decision will {reviewDecision.status === "approved" ? "approve the project for listing" : 
                  reviewDecision.status === "rejected" ? "reject the project" : "request revisions from the seller"}.
                  Make sure you have thoroughly reviewed all project materials.
                </AlertDescription>
              </Alert>

              <Button
                onClick={submitReview}
                disabled={submitting || !reviewDecision.comments.trim()}
                className={`w-full ${getStatusColor(reviewDecision.status)} text-white`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit {reviewDecision.status === "approved" ? "Approval" : 
                    reviewDecision.status === "rejected" ? "Rejection" : "Revision Request"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 