"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Download, 
  Search, 
  Award, 
  CheckCircle, 
  Calendar,
  Building,
  Leaf,
  Share,
  Eye,
  Filter,
  ExternalLink
} from "lucide-react"
import { api, type Certificate } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

export function Certificates() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date-desc")

  useEffect(() => {
    if (user) {
      fetchCertificates()
    }
  }, [user, filterType])

  const fetchCertificates = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await api.getUserCertificates(user.id, filterType === "all" ? undefined : filterType)
      setCertificates(data)
    } catch (error) {
      console.error("Error fetching certificates:", error)
      toast({
        title: "Error",
        description: "Failed to load certificates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = async (certificate: Certificate) => {
    try {
      if (certificate.pdf_url) {
        // Open existing PDF
        window.open(certificate.pdf_url, '_blank')
      } else {
        // Generate PDF
        const pdfUrl = await api.generateCertificatePDF(certificate.id)
        
        // Update certificate with PDF URL
        await api.updateCertificate(certificate.id, { pdf_url: pdfUrl })
        
        // Download the PDF
        window.open(pdfUrl, '_blank')
        
        // Update local state
        setCertificates(prev => 
          prev.map(cert => 
            cert.id === certificate.id 
              ? { ...cert, pdf_url: pdfUrl }
              : cert
          )
        )
      }

      // Log activity
      await api.logActivity({
        user_id: user!.id,
        activity_type: "certificate_downloaded",
        description: `Downloaded ${certificate.certificate_type} certificate`,
        metadata: {
          certificate_id: certificate.id,
          certificate_type: certificate.certificate_type
        }
      })

      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Error downloading certificate:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive",
      })
    }
  }

  const shareCertificate = async (certificate: Certificate) => {
    const shareData = {
      title: `${certificate.certificate_type} Certificate - Rsustain Carbon Exchange`,
      text: `Check out my carbon ${certificate.certificate_type} certificate from Rsustain Carbon Exchange`,
      url: `${window.location.origin}/certificates/${certificate.id}`
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        toast({
          title: "Certificate Shared",
          description: "Certificate shared successfully.",
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(shareData.url)
      toast({
        title: "Link Copied",
        description: "Certificate link copied to clipboard.",
      })
    }

    // Log activity
    await api.logActivity({
      user_id: user!.id,
      activity_type: "certificate_shared",
      description: `Shared ${certificate.certificate_type} certificate`,
      metadata: {
        certificate_id: certificate.id,
        certificate_type: certificate.certificate_type
      }
    })
  }

  const filteredCertificates = certificates
    .filter(cert => {
      const matchesSearch = searchTerm === "" || 
        cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
        case "date-asc":
          return new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime()
        case "type":
          return a.certificate_type.localeCompare(b.certificate_type)
        case "quantity":
          return (b.quantity || 0) - (a.quantity || 0)
        default:
          return 0
      }
    })

  const getCertificateIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <Building className="h-5 w-5 text-blue-400" />
      case "retirement":
        return <Leaf className="h-5 w-5 text-green-400" />
      case "verification":
        return <CheckCircle className="h-5 w-5 text-purple-400" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const getCertificateTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-blue-600"
      case "retirement":
        return "bg-green-600"
      case "verification":
        return "bg-purple-600"
      default:
        return "bg-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
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
          <h2 className="text-2xl font-bold mb-2">My Certificates</h2>
          <p className="text-gray-400">View and download your carbon credit certificates</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-400">
            {certificates.length} certificates
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-white/20"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 glass border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="retirement">Retirement</SelectItem>
                <SelectItem value="verification">Verification</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 glass border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="type">By Type</SelectItem>
                <SelectItem value="quantity">By Quantity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Grid */}
      {filteredCertificates.length === 0 ? (
        <Card className="glass-card border-white/20 text-center p-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Certificates Found</h3>
          <p className="text-gray-400">
            {certificates.length === 0 
              ? "You don't have any certificates yet. Purchase or retire some carbon credits to get started."
              : "No certificates match your current filters."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate) => (
            <Card key={certificate.id} className="glass-card border-white/20 hover:border-green-500/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCertificateIcon(certificate.certificate_type)}
                    <Badge className={getCertificateTypeColor(certificate.certificate_type)}>
                      {certificate.certificate_type}
                    </Badge>
                  </div>
                  {certificate.verification_seal && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                </div>
                <CardTitle className="text-lg">
                  Certificate #{certificate.certificate_number.slice(-8)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {certificate.projects && (
                    <p className="text-sm font-medium">{certificate.projects.name}</p>
                  )}
                  
                  {certificate.quantity && (
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-400" />
                      <span className="text-sm">{certificate.quantity} credits</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-sm">
                      Issued {new Date(certificate.issue_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {certificate.metadata && (
                  <div className="p-3 glass-strong rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Details</h4>
                    {certificate.certificate_type === "retirement" && (
                      <div className="space-y-1 text-xs text-gray-400">
                        {certificate.metadata.retirement_reason && (
                          <p><span className="font-medium">Reason:</span> {certificate.metadata.retirement_reason}</p>
                        )}
                        {certificate.metadata.beneficiary_name && (
                          <p><span className="font-medium">Beneficiary:</span> {certificate.metadata.beneficiary_name}</p>
                        )}
                      </div>
                    )}
                    {certificate.certificate_type === "purchase" && (
                      <div className="space-y-1 text-xs text-gray-400">
                        {certificate.metadata.purchase_date && (
                          <p><span className="font-medium">Purchase Date:</span> {new Date(certificate.metadata.purchase_date).toLocaleDateString()}</p>
                        )}
                        {certificate.metadata.payment_method && (
                          <p><span className="font-medium">Payment:</span> {certificate.metadata.payment_method}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => downloadCertificate(certificate)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareCertificate(certificate)}
                    className="flex-1"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                  onClick={() => window.open(`/certificates/${certificate.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Certificate
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {certificates.length > 0 && (
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificate Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {certificates.filter(c => c.certificate_type === "purchase").length}
                </div>
                <div className="text-sm text-gray-400">Purchase Certificates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {certificates.filter(c => c.certificate_type === "retirement").length}
                </div>
                <div className="text-sm text-gray-400">Retirement Certificates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {certificates.reduce((sum, cert) => sum + (cert.quantity || 0), 0)}
                </div>
                <div className="text-sm text-gray-400">Total Credits Certified</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 