"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Leaf, 
  Award, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Building,
  Globe,
  Target
} from "lucide-react"
import { api, type Credit, type Transaction } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface RetirementForm {
  creditIds: string[]
  totalQuantity: number
  retirementReason: string
  beneficiaryName: string
  beneficiaryType: "individual" | "organization" | "event" | "project"
  retirementDate: string
  notes: string
  generateCertificate: boolean
  makePublic: boolean
}

export function CreditRetirement() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [availableCredits, setAvailableCredits] = useState<Credit[]>([])
  const [selectedCredits, setSelectedCredits] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<"select" | "details" | "confirmation">("select")
  
  const [form, setForm] = useState<RetirementForm>({
    creditIds: [],
    totalQuantity: 0,
    retirementReason: "",
    beneficiaryName: "",
    beneficiaryType: "organization",
    retirementDate: new Date().toISOString().split('T')[0],
    notes: "",
    generateCertificate: true,
    makePublic: false
  })

  const [retirementReasons] = useState([
    "Corporate sustainability goals",
    "Carbon neutrality commitment",
    "Product/service carbon offsetting",
    "Event carbon neutrality",
    "Employee travel offsetting",
    "Supply chain emissions",
    "Voluntary environmental commitment",
    "ESG reporting requirements",
    "Customer carbon offsetting program",
    "Other (specify in notes)"
  ])

  useEffect(() => {
    if (user) {
      fetchAvailableCredits()
    }
  }, [user])

  const fetchAvailableCredits = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch user's purchased credits that haven't been retired
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id,
          quantity,
          price_per_credit,
          total_amount,
          created_at,
          projects (
            id,
            name,
            project_type,
            certification,
            vintage_year,
            location
          )
        `)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')

      if (error) {
        console.error('Error fetching credits:', error)
        toast({
          title: "Error",
          description: "Failed to load available credits.",
          variant: "destructive",
        })
        return
      }

      // Convert transactions to credit format for retirement
      const credits: Credit[] = transactions?.map(transaction => ({
        id: transaction.id,
        project_id: transaction.projects.id,
        vintage_year: transaction.projects.vintage_year || new Date().getFullYear(),
        quantity: transaction.quantity,
        price: transaction.price_per_credit,
        status: 'available' as const,
        buyer_id: user.id,
        created_at: transaction.created_at,
        projects: transaction.projects
      })) || []

      setAvailableCredits(credits)
    } catch (error) {
      console.error("Error fetching credits:", error)
      toast({
        title: "Error",
        description: "Failed to load credits. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreditSelection = (creditId: string, checked: boolean) => {
    let newSelection: string[]
    if (checked) {
      newSelection = [...selectedCredits, creditId]
    } else {
      newSelection = selectedCredits.filter(id => id !== creditId)
    }
    
    setSelectedCredits(newSelection)
    
    // Calculate total quantity
    const totalQuantity = availableCredits
      .filter(credit => newSelection.includes(credit.id))
      .reduce((sum, credit) => sum + credit.quantity, 0)
    
    setForm(prev => ({
      ...prev,
      creditIds: newSelection,
      totalQuantity
    }))
  }

  const updateForm = (field: keyof RetirementForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (currentStep: string): boolean => {
    switch (currentStep) {
      case "select":
        return selectedCredits.length > 0
      case "details":
        return !!(form.retirementReason && form.beneficiaryName)
      default:
        return true
    }
  }

  const processRetirement = async () => {
    if (!validateStep("details")) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      // Create retirement records
      const retirementData = selectedCredits.map(creditId => {
        const credit = availableCredits.find(c => c.id === creditId)!
        return {
          project_id: credit.project_id,
          vintage_year: credit.vintage_year,
          quantity: credit.quantity,
          price: credit.price,
          status: 'retired' as const,
          buyer_id: user!.id,
          retirement_reason: form.retirementReason,
          retirement_date: new Date(form.retirementDate).toISOString()
        }
      })

      const { data: retiredCredits, error: retirementError } = await supabase
        .from('credits')
        .insert(retirementData)
        .select()

      if (retirementError) {
        throw new Error("Failed to retire credits")
      }

      // Generate retirement certificate if requested
      if (form.generateCertificate) {
        const certificateData = {
          certificate_type: 'retirement' as const,
          user_id: user!.id,
          certificate_number: `RETIREMENT-${Date.now()}-${user!.id.slice(0, 8)}`,
          quantity: form.totalQuantity,
          metadata: {
            retirement_reason: form.retirementReason,
            beneficiary_name: form.beneficiaryName,
            beneficiary_type: form.beneficiaryType,
            retirement_date: form.retirementDate,
            notes: form.notes,
            retired_credits: retiredCredits.map(credit => ({
              project_id: credit.project_id,
              quantity: credit.quantity,
              vintage_year: credit.vintage_year
            }))
          }
        }

        const { error: certificateError } = await supabase
          .from('certificates')
          .insert(certificateData)

        if (certificateError) {
          console.error('Certificate creation error:', certificateError)
        }
      }

      // Log activity
      await api.logActivity({
        user_id: user!.id,
        activity_type: "credits_retired",
        description: `Retired ${form.totalQuantity} carbon credits for: ${form.retirementReason}`,
        metadata: {
          retired_credits: retiredCredits.length,
          total_quantity: form.totalQuantity,
          retirement_reason: form.retirementReason,
          beneficiary: form.beneficiaryName
        }
      })

      setStep("confirmation")
      toast({
        title: "Credits Retired Successfully!",
        description: `${form.totalQuantity} carbon credits have been permanently retired.`,
      })

    } catch (error: any) {
      console.error("Retirement processing error:", error)
      toast({
        title: "Retirement Failed",
        description: error.message || "Failed to retire credits. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
            <div className="h-96 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (availableCredits.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass-card border-white/20 text-center p-12">
          <Leaf className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">No Credits Available</h2>
          <p className="text-gray-400 mb-4">You don't have any carbon credits available for retirement</p>
          <Button onClick={() => window.location.href = "/marketplace"} className="bg-green-600 hover:bg-green-700">
            Browse Marketplace
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Retire Carbon Credits</h1>
        <p className="text-gray-400">Permanently retire your carbon credits to claim environmental benefits</p>
        
        <div className="flex items-center gap-4 mt-4">
          {["select", "details", "confirmation"].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepName 
                  ? "bg-green-600 text-white" 
                  : ["select", "details", "confirmation"].indexOf(step) > index
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}>
                {["select", "details", "confirmation"].indexOf(step) > index ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="ml-2 text-sm capitalize">{stepName === "select" ? "Select Credits" : stepName}</span>
              {index < 2 && <div className="w-8 h-px bg-gray-600 mx-4" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Select Credits */}
          {step === "select" && (
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  Select Credits to Retire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableCredits.map((credit) => (
                  <div key={credit.id} className="flex items-center gap-4 p-4 border border-white/10 rounded-lg">
                    <Checkbox
                      checked={selectedCredits.includes(credit.id)}
                      onCheckedChange={(checked) => handleCreditSelection(credit.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{credit.projects?.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {credit.projects?.project_type?.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {credit.projects?.certification}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Vintage {credit.vintage_year}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        📍 {credit.projects?.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{credit.quantity} credits</div>
                      <div className="text-sm text-gray-400">${credit.price}/credit</div>
                    </div>
                  </div>
                ))}

                <Button 
                  onClick={() => setStep("details")} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!validateStep("select")}
                >
                  Continue to Retirement Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Retirement Details */}
          {step === "details" && (
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Retirement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="retirement-reason">Retirement Reason *</Label>
                  <Select value={form.retirementReason} onValueChange={(value) => updateForm("retirementReason", value)}>
                    <SelectTrigger className="glass border-white/20">
                      <SelectValue placeholder="Select retirement reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {retirementReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="beneficiary-name">Beneficiary Name *</Label>
                    <Input
                      id="beneficiary-name"
                      value={form.beneficiaryName}
                      onChange={(e) => updateForm("beneficiaryName", e.target.value)}
                      className="glass border-white/20"
                      placeholder="Company or individual name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="beneficiary-type">Beneficiary Type</Label>
                    <Select value={form.beneficiaryType} onValueChange={(value: any) => updateForm("beneficiaryType", value)}>
                      <SelectTrigger className="glass border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="retirement-date">Retirement Date</Label>
                  <Input
                    id="retirement-date"
                    type="date"
                    value={form.retirementDate}
                    onChange={(e) => updateForm("retirementDate", e.target.value)}
                    className="glass border-white/20"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => updateForm("notes", e.target.value)}
                    className="glass border-white/20"
                    placeholder="Additional context or details about this retirement..."
                    rows={3}
                  />
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="certificate" 
                      checked={form.generateCertificate}
                      onCheckedChange={(checked) => updateForm("generateCertificate", checked)}
                    />
                    <Label htmlFor="certificate">Generate retirement certificate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="public" 
                      checked={form.makePublic}
                      onCheckedChange={(checked) => updateForm("makePublic", checked)}
                    />
                    <Label htmlFor="public">Make retirement publicly visible</Label>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Credit retirement is permanent and irreversible. Once retired, these credits cannot be sold or transferred.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep("select")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={processRetirement} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!validateStep("details") || processing}
                  >
                    {processing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Award className="h-4 w-4 mr-2" />
                        Retire {form.totalQuantity} Credits
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirmation" && (
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Credits Retired Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                  <Award className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Environmental Impact Claimed</h3>
                  <p className="text-gray-400">
                    {form.totalQuantity} carbon credits have been permanently retired on behalf of {form.beneficiaryName}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 glass-strong rounded-lg">
                    <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Credits Retired</h4>
                    <p className="text-2xl font-bold text-green-400">{form.totalQuantity}</p>
                  </div>
                  <div className="p-4 glass-strong rounded-lg">
                    <Globe className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">CO₂ Offset</h4>
                    <p className="text-2xl font-bold text-green-400">
                      {(form.totalQuantity * 0.85).toFixed(1)}t
                    </p>
                  </div>
                </div>

                <div className="text-left p-4 glass-strong rounded-lg">
                  <h4 className="font-medium mb-2">Retirement Summary</h4>
                  <div className="space-y-1 text-sm text-gray-400">
                    <p><span className="font-medium">Reason:</span> {form.retirementReason}</p>
                    <p><span className="font-medium">Beneficiary:</span> {form.beneficiaryName}</p>
                    <p><span className="font-medium">Date:</span> {new Date(form.retirementDate).toLocaleDateString()}</p>
                    {form.notes && <p><span className="font-medium">Notes:</span> {form.notes}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {form.generateCertificate && (
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </Button>
                  )}
                  <Button 
                    onClick={() => window.location.href = "/dashboard"}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    View Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Retirement Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="glass-card border-white/20 sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Retirement Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Credits Selected</span>
                  <span>{form.totalQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CO₂ Equivalent</span>
                  <span>{(form.totalQuantity * 0.85).toFixed(1)}t</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Projects</span>
                  <span>{new Set(selectedCredits.map(id => availableCredits.find(c => c.id === id)?.project_id)).size}</span>
                </div>
              </div>

              {form.retirementReason && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm mb-2">Retirement Details</h4>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p><span className="font-medium">Reason:</span> {form.retirementReason}</p>
                      {form.beneficiaryName && <p><span className="font-medium">Beneficiary:</span> {form.beneficiaryName}</p>}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Environmental Impact</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Leaf className="h-3 w-3" />
                  Permanent CO₂ removal
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle className="h-3 w-3" />
                  Verified carbon impact
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Award className="h-3 w-3" />
                  Official retirement certificate
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 