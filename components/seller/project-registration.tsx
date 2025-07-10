"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  FileText, 
  Save, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  MapPin,
  Calendar,
  DollarSign,
  Leaf,
  Building,
  Globe,
  Image,
  X,
  Plus
} from "lucide-react"
import { api } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ProjectFormData {
  // Basic Information
  name: string
  description: string
  location: string
  project_type: string
  certification: string
  
  // Credit Details
  total_credits: number
  available_credits: number
  price_per_credit: number
  vintage_year: number
  
  // Project Details
  impact_story: string
  sdg_goals: string[]
  methodology: string
  project_start_date: string
  project_end_date: string
  
  // Media and Documentation
  media_gallery: string[]
  project_documents: Array<{
    name: string
    type: string
    url: string
    description: string
  }>
  
  // Additional Information
  additionality_proof: string
  monitoring_plan: string
  co_benefits: string[]
  risk_mitigation: string
  
  // Contact Information
  contact_name: string
  contact_email: string
  contact_phone: string
  organization_name: string
}

export function ProjectRegistration() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    location: "",
    project_type: "",
    certification: "",
    total_credits: 0,
    available_credits: 0,
    price_per_credit: 0,
    vintage_year: new Date().getFullYear(),
    impact_story: "",
    sdg_goals: [],
    methodology: "",
    project_start_date: "",
    project_end_date: "",
    media_gallery: [],
    project_documents: [],
    additionality_proof: "",
    monitoring_plan: "",
    co_benefits: [],
    risk_mitigation: "",
    contact_name: "",
    contact_email: user?.email || "",
    contact_phone: "",
    organization_name: ""
  })
  
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const projectTypes = [
    { value: "reforestation", label: "Reforestation & Afforestation" },
    { value: "renewable_energy", label: "Renewable Energy" },
    { value: "energy_efficiency", label: "Energy Efficiency" },
    { value: "methane_capture", label: "Methane Capture & Destruction" },
    { value: "ocean_conservation", label: "Ocean & Marine Conservation" }
  ]

  const certifications = [
    { value: "VERRA", label: "Verified Carbon Standard (VCS)" },
    { value: "GOLD_STANDARD", label: "Gold Standard" },
    { value: "CARBON_CREDIT_STANDARD", label: "Climate Action Reserve" },
    { value: "AMERICAN_CARBON_REGISTRY", label: "American Carbon Registry" }
  ]

  const sdgGoals = [
    "No Poverty", "Zero Hunger", "Good Health and Well-being", "Quality Education",
    "Gender Equality", "Clean Water and Sanitation", "Affordable and Clean Energy",
    "Decent Work and Economic Growth", "Industry, Innovation and Infrastructure",
    "Reduced Inequalities", "Sustainable Cities and Communities", "Responsible Consumption",
    "Climate Action", "Life Below Water", "Life on Land", "Peace, Justice and Strong Institutions"
  ]

  const coBenefits = [
    "Biodiversity Conservation", "Water Quality Improvement", "Soil Health",
    "Air Quality Improvement", "Community Development", "Job Creation",
    "Education and Training", "Gender Empowerment", "Indigenous Rights",
    "Technology Transfer", "Economic Development", "Health Benefits"
  ]

  const steps = [
    { id: 0, title: "Basic Information", description: "Project overview and type" },
    { id: 1, title: "Credit Details", description: "Carbon credit specifications" },
    { id: 2, title: "Impact & Goals", description: "Environmental and social impact" },
    { id: 3, title: "Documentation", description: "Required documents and media" },
    { id: 4, title: "Review & Submit", description: "Final review before submission" }
  ]

  const updateFormData = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayUpdate = (field: keyof ProjectFormData, value: string, checked: boolean) => {
    const currentArray = formData[field] as string[]
    const updatedArray = checked
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value)
    updateFormData(field, updatedArray)
  }

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return !!(formData.name && formData.description && formData.location && 
                 formData.project_type && formData.certification)
      case 1:
        return !!(formData.total_credits > 0 && formData.available_credits > 0 && 
                 formData.price_per_credit > 0 && formData.vintage_year)
      case 2:
        return !!(formData.impact_story && formData.sdg_goals.length > 0 && formData.additionality_proof)
      case 3:
        return !!(formData.project_documents.length > 0 && formData.monitoring_plan && 
                 formData.contact_name && formData.contact_email)
      case 4:
        return !!(formData.contact_name && formData.contact_email && formData.organization_name)
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    } else {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive",
      })
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const saveDraft = async () => {
    if (!user) return

    setSaving(true)
    try {
      const projectData = {
        ...formData,
        seller_id: user.id,
        status: "draft",
        verification_status: "not_submitted",
        created_at: new Date().toISOString()
      }

      const project = await api.createProject(projectData)

      // Log activity
      await api.logActivity({
        user_id: user.id,
        activity_type: "project_draft_saved",
        description: `Saved draft for project: ${formData.name}`,
        metadata: {
          project_id: project.id,
          step: currentStep
        }
      })

      toast({
        title: "Draft Saved",
        description: "Your project draft has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving draft:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const submitProject = async () => {
    if (!user || !validateStep(4)) return

    setSubmitting(true)
    try {
      const projectData = {
        ...formData,
        seller_id: user.id,
        status: "pending_verification",
        verification_status: "submitted",
        created_at: new Date().toISOString()
      }

      const project = await api.createProject(projectData)

      // Create initial verification record
      await api.createVerification({
        project_id: project.id,
        status: "pending",
        priority: "medium",
        comments: "New project submitted for verification"
      })

      // Log activity
      await api.logActivity({
        user_id: user.id,
        activity_type: "project_submitted",
        description: `Submitted project for verification: ${formData.name}`,
        metadata: {
          project_id: project.id
        }
      })

      toast({
        title: "Project Submitted!",
        description: "Your project has been submitted for verification.",
      })

      // Redirect to seller dashboard
      router.push("/seller/dashboard")
    } catch (error) {
      console.error("Error submitting project:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (files: FileList | null, type: 'document' | 'media') => {
    if (!files || files.length === 0) return

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Simulate file upload - in real implementation, upload to storage service
        const fileUrl = `https://storage.rsustain.com/${type}/${Date.now()}-${file.name}`
        
        if (type === 'document') {
          const newDoc = {
            name: file.name,
            type: file.type,
            url: fileUrl,
            description: ""
          }
          setFormData(prev => ({
            ...prev,
            project_documents: [...prev.project_documents, newDoc]
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            media_gallery: [...prev.media_gallery, fileUrl]
          }))
        }
      })

      await Promise.all(uploadPromises)
      
      toast({
        title: "Files Uploaded",
        description: `${files.length} file(s) uploaded successfully.`,
      })
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    }
  }

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      project_documents: prev.project_documents.filter((_, i) => i !== index)
    }))
  }

  const removeMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media_gallery: prev.media_gallery.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Register Carbon Credit Project</h1>
        <p className="text-gray-400">Submit your project for verification and listing on our marketplace</p>
      </div>

      {/* Progress Steps */}
      <Card className="glass-card border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center ${index <= currentStep ? 'text-green-400' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    index < currentStep 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : index === currentStep
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-600 text-gray-400'
                  }`}>
                    {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-400">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-px mx-4 ${index < currentStep ? 'bg-green-600' : 'bg-gray-600'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card className="glass-card border-white/20">
        <CardContent className="p-6">
          {/* Step 0: Basic Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Basic Project Information</h2>
                <p className="text-gray-400">Provide the fundamental details about your carbon credit project</p>
              </div>

              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="glass border-white/20"
                  placeholder="Amazon Rainforest Conservation Project"
                />
              </div>

              <div>
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  className="glass border-white/20"
                  placeholder="Provide a comprehensive description of your project..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Project Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateFormData("location", e.target.value)}
                    className="glass border-white/20"
                    placeholder="Brazil, Amazon Rainforest"
                  />
                </div>
                <div>
                  <Label htmlFor="organization">Organization Name *</Label>
                  <Input
                    id="organization"
                    value={formData.organization_name}
                    onChange={(e) => updateFormData("organization_name", e.target.value)}
                    className="glass border-white/20"
                    placeholder="Your Organization Ltd."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-type">Project Type *</Label>
                  <Select value={formData.project_type} onValueChange={(value) => updateFormData("project_type", value)}>
                    <SelectTrigger className="glass border-white/20">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="certification">Certification Standard *</Label>
                  <Select value={formData.certification} onValueChange={(value) => updateFormData("certification", value)}>
                    <SelectTrigger className="glass border-white/20">
                      <SelectValue placeholder="Select certification" />
                    </SelectTrigger>
                    <SelectContent>
                      {certifications.map((cert) => (
                        <SelectItem key={cert.value} value={cert.value}>{cert.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Project Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.project_start_date}
                    onChange={(e) => updateFormData("project_start_date", e.target.value)}
                    className="glass border-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Project End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.project_end_date}
                    onChange={(e) => updateFormData("project_end_date", e.target.value)}
                    className="glass border-white/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Credit Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Carbon Credit Details</h2>
                <p className="text-gray-400">Specify the carbon credit quantities and pricing</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total-credits">Total Credits to Issue *</Label>
                  <Input
                    id="total-credits"
                    type="number"
                    value={formData.total_credits}
                    onChange={(e) => updateFormData("total_credits", parseInt(e.target.value) || 0)}
                    className="glass border-white/20"
                    min="1"
                    placeholder="10000"
                  />
                  <p className="text-xs text-gray-400 mt-1">Total carbon credits this project will generate</p>
                </div>
                <div>
                  <Label htmlFor="available-credits">Initially Available *</Label>
                  <Input
                    id="available-credits"
                    type="number"
                    value={formData.available_credits}
                    onChange={(e) => updateFormData("available_credits", parseInt(e.target.value) || 0)}
                    className="glass border-white/20"
                    min="1"
                    max={formData.total_credits}
                    placeholder="5000"
                  />
                  <p className="text-xs text-gray-400 mt-1">Credits available for immediate sale</p>
                </div>
                <div>
                  <Label htmlFor="price-per-credit">Price per Credit (USD) *</Label>
                  <Input
                    id="price-per-credit"
                    type="number"
                    step="0.01"
                    value={formData.price_per_credit}
                    onChange={(e) => updateFormData("price_per_credit", parseFloat(e.target.value) || 0)}
                    className="glass border-white/20"
                    min="0.01"
                    placeholder="25.00"
                  />
                  <p className="text-xs text-gray-400 mt-1">Initial selling price per carbon credit</p>
                </div>
              </div>

              <div>
                <Label htmlFor="vintage-year">Vintage Year *</Label>
                <Select 
                  value={formData.vintage_year.toString()} 
                  onValueChange={(value) => updateFormData("vintage_year", parseInt(value))}
                >
                  <SelectTrigger className="glass border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">Year when carbon reductions occurred</p>
              </div>

              <div>
                <Label htmlFor="methodology">Carbon Accounting Methodology</Label>
                <Input
                  id="methodology"
                  value={formData.methodology}
                  onChange={(e) => updateFormData("methodology", e.target.value)}
                  className="glass border-white/20"
                  placeholder="e.g., VM0009, CDM AMS-III.D"
                />
                <p className="text-xs text-gray-400 mt-1">Methodology used for carbon accounting</p>
              </div>

              {/* Credit Calculations Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 glass-strong rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    ${(formData.available_credits * formData.price_per_credit).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Initial Revenue Potential</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {(formData.available_credits * 0.85).toFixed(1)}t
                  </div>
                  <div className="text-sm text-gray-400">CO₂ Equivalent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.round(formData.available_credits * 0.85 * 40).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Trees Equivalent</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Impact & Goals */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Environmental & Social Impact</h2>
                <p className="text-gray-400">Describe your project's broader impact and alignment with SDGs</p>
              </div>

              <div>
                <Label htmlFor="impact-story">Impact Story *</Label>
                <Textarea
                  id="impact-story"
                  value={formData.impact_story}
                  onChange={(e) => updateFormData("impact_story", e.target.value)}
                  className="glass border-white/20"
                  placeholder="Tell the story of your project's environmental and social impact..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Sustainable Development Goals (SDGs) *</Label>
                <p className="text-sm text-gray-400 mb-3">Select all SDGs that your project contributes to</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {sdgGoals.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal}
                        checked={formData.sdg_goals.includes(goal)}
                        onCheckedChange={(checked) => handleArrayUpdate("sdg_goals", goal, checked as boolean)}
                      />
                      <Label htmlFor={goal} className="text-sm">{goal}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Co-Benefits</Label>
                <p className="text-sm text-gray-400 mb-3">Additional environmental and social benefits</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {coBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-center space-x-2">
                      <Checkbox
                        id={benefit}
                        checked={formData.co_benefits.includes(benefit)}
                        onCheckedChange={(checked) => handleArrayUpdate("co_benefits", benefit, checked as boolean)}
                      />
                      <Label htmlFor={benefit} className="text-sm">{benefit}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="additionality">Additionality Proof *</Label>
                <Textarea
                  id="additionality"
                  value={formData.additionality_proof}
                  onChange={(e) => updateFormData("additionality_proof", e.target.value)}
                  className="glass border-white/20"
                  placeholder="Explain how your project demonstrates additionality - that the emission reductions would not have occurred without the project..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="risk-mitigation">Risk Mitigation Strategies</Label>
                <Textarea
                  id="risk-mitigation"
                  value={formData.risk_mitigation}
                  onChange={(e) => updateFormData("risk_mitigation", e.target.value)}
                  className="glass border-white/20"
                  placeholder="Describe measures taken to mitigate project risks (permanence, leakage, etc.)..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Documentation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Project Documentation</h2>
                <p className="text-gray-400">Upload required documents and project media</p>
              </div>

              {/* Document Upload */}
              <div>
                <Label>Project Documents *</Label>
                <p className="text-sm text-gray-400 mb-3">Upload PDDs, monitoring reports, and other verification documents</p>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e.target.files, 'document')}
                    className="hidden"
                    id="document-upload"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400">Click to upload documents or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 50MB each</p>
                  </label>
                </div>

                {formData.project_documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.project_documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 glass-strong rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-400">{doc.type}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDocument(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Media Upload */}
              <div>
                <Label>Project Media</Label>
                <p className="text-sm text-gray-400 mb-3">Upload images and videos showcasing your project</p>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e.target.files, 'media')}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400">Click to upload media or drag and drop</p>
                    <p className="text-xs text-gray-500">Images and videos up to 100MB each</p>
                  </label>
                </div>

                {formData.media_gallery.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.media_gallery.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMedia(index)}
                          className="absolute top-1 right-1 bg-red-600/80 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  All uploaded documents will be reviewed by our verification team. 
                  Ensure all documents are current, complete, and properly signed.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 2: Impact & Goals */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Environmental & Social Impact</h2>
                <p className="text-gray-400">Describe your project's broader impact and alignment with SDGs</p>
              </div>

              <div>
                <Label htmlFor="impact-story">Impact Story *</Label>
                <Textarea
                  id="impact-story"
                  value={formData.impact_story}
                  onChange={(e) => updateFormData("impact_story", e.target.value)}
                  className="glass border-white/20"
                  placeholder="Tell the story of your project's environmental and social impact..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Sustainable Development Goals (SDGs) *</Label>
                <p className="text-sm text-gray-400 mb-3">Select all SDGs that your project contributes to</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {sdgGoals.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal}
                        checked={formData.sdg_goals.includes(goal)}
                        onCheckedChange={(checked) => handleArrayUpdate("sdg_goals", goal, checked as boolean)}
                      />
                      <Label htmlFor={goal} className="text-sm">{goal}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Co-Benefits</Label>
                <p className="text-sm text-gray-400 mb-3">Additional environmental and social benefits</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {coBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-center space-x-2">
                      <Checkbox
                        id={benefit}
                        checked={formData.co_benefits.includes(benefit)}
                        onCheckedChange={(checked) => handleArrayUpdate("co_benefits", benefit, checked as boolean)}
                      />
                      <Label htmlFor={benefit} className="text-sm">{benefit}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="additionality">Additionality Proof *</Label>
                <Textarea
                  id="additionality"
                  value={formData.additionality_proof}
                  onChange={(e) => updateFormData("additionality_proof", e.target.value)}
                  className="glass border-white/20"
                  placeholder="Explain how your project demonstrates additionality - that the emission reductions would not have occurred without the project..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="risk-mitigation">Risk Mitigation Strategies</Label>
                <Textarea
                  id="risk-mitigation"
                  value={formData.risk_mitigation}
                  onChange={(e) => updateFormData("risk_mitigation", e.target.value)}
                  className="glass border-white/20"
                  placeholder="Describe measures taken to mitigate project risks (permanence, leakage, etc.)..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Documentation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Project Documentation</h2>
                <p className="text-gray-400">Upload required documents and project media</p>
              </div>

              {/* Document Upload */}
              <div>
                <Label>Project Documents *</Label>
                <p className="text-sm text-gray-400 mb-3">Upload PDDs, monitoring reports, and other verification documents</p>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e.target.files, 'document')}
                    className="hidden"
                    id="document-upload"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400">Click to upload documents or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 50MB each</p>
                  </label>
                </div>

                {formData.project_documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.project_documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 glass-strong rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-400">{doc.type}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDocument(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Media Upload */}
              <div>
                <Label>Project Media</Label>
                <p className="text-sm text-gray-400 mb-3">Upload images and videos showcasing your project</p>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e.target.files, 'media')}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400">Click to upload media or drag and drop</p>
                    <p className="text-xs text-gray-500">Images and videos up to 100MB each</p>
                  </label>
                </div>

                {formData.media_gallery.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.media_gallery.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMedia(index)}
                          className="absolute top-1 right-1 bg-red-600/80 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="monitoring-plan">Monitoring Plan *</Label>
                <Textarea
                  id="monitoring-plan"
                  value={formData.monitoring_plan}
                  onChange={(e) => updateFormData("monitoring_plan", e.target.value)}
                  className="glass border-white/20"
                  placeholder="Describe your monitoring plan, measurement frequency, and data collection methods..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contact-name">Primary Contact *</Label>
                  <Input
                    id="contact-name"
                    value={formData.contact_name}
                    onChange={(e) => updateFormData("contact_name", e.target.value)}
                    className="glass border-white/20"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email">Contact Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => updateFormData("contact_email", e.target.value)}
                    className="glass border-white/20"
                    placeholder="john@organization.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    value={formData.contact_phone}
                    onChange={(e) => updateFormData("contact_phone", e.target.value)}
                    className="glass border-white/20"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  All uploaded documents will be reviewed by our verification team. 
                  Ensure all documents are current, complete, and properly signed.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Review & Submit</h2>
                <p className="text-gray-400">Review your project details before submission</p>
              </div>

              {/* Project Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-strong">
                  <CardHeader>
                    <CardTitle className="text-lg">Project Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="font-medium">Name:</span> {formData.name}</div>
                    <div><span className="font-medium">Type:</span> {formData.project_type?.replace('_', ' ')}</div>
                    <div><span className="font-medium">Location:</span> {formData.location}</div>
                    <div><span className="font-medium">Certification:</span> {formData.certification}</div>
                    <div><span className="font-medium">Organization:</span> {formData.organization_name}</div>
                  </CardContent>
                </Card>

                <Card className="glass-strong">
                  <CardHeader>
                    <CardTitle className="text-lg">Credit Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="font-medium">Total Credits:</span> {formData.total_credits.toLocaleString()}</div>
                    <div><span className="font-medium">Available:</span> {formData.available_credits.toLocaleString()}</div>
                    <div><span className="font-medium">Price:</span> ${formData.price_per_credit}/credit</div>
                    <div><span className="font-medium">Vintage:</span> {formData.vintage_year}</div>
                    <div><span className="font-medium">Revenue Potential:</span> ${(formData.available_credits * formData.price_per_credit).toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="text-lg">Impact & Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <span className="font-medium">SDG Goals:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.sdg_goals.map(goal => (
                        <Badge key={goal} variant="outline" className="text-xs">{goal}</Badge>
                      ))}
                    </div>
                  </div>
                  {formData.co_benefits.length > 0 && (
                    <div>
                      <span className="font-medium">Co-Benefits:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.co_benefits.map(benefit => (
                          <Badge key={benefit} variant="outline" className="text-xs">{benefit}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle className="text-lg">Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Documents:</span> {formData.project_documents.length} files
                    </div>
                    <div>
                      <span className="font-medium">Media:</span> {formData.media_gallery.length} files
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your project will be reviewed by our verification team within 5-10 business days. 
                  You will receive updates via email and can track progress in your dashboard.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!validateStep(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={submitProject}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!validateStep(currentStep) || submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Verification
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 