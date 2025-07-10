"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, Plus, Trash2, AlertTriangle, CheckCircle, Download, Leaf, TrendingUp, Target } from "lucide-react"
import { carbonCalculatorApi } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface EmissionEntry {
  id: string
  sourceCategory?: string
  energyType?: string
  categoryNumber?: number
  fuelType?: string
  activityData: number
  activityUnit: string
  facilityName?: string
  location?: string
  notes?: string
  calculationMethod?: string
  gridRegion?: string
  dataQuality?: number
}

interface AssessmentData {
  organizationName: string
  assessmentYear: number
  reportingPeriodStart: string
  reportingPeriodEnd: string
  assessmentBoundary: string
  methodology: string
}

interface CalculationResult {
  assessmentId?: string
  summary: {
    scope1Total: number
    scope2Total: number
    scope3Total: number
    totalEmissions: number
    averageConfidence: number
    emissionsByScope: {
      scope1: number
      scope2: number
      scope3: number
    }
  }
  insights: Array<{
    type: string
    message: string
    priority: string
  }>
  recommendations: Array<{
    scope: number
    action: string
    description: string
    potentialReduction: string
    priority: string
  }>
}

export function CarbonCalculator() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    organizationName: '',
    assessmentYear: new Date().getFullYear(),
    reportingPeriodStart: `${new Date().getFullYear()}-01-01`,
    reportingPeriodEnd: `${new Date().getFullYear()}-12-31`,
    assessmentBoundary: 'Operational Control',
    methodology: 'GHG_PROTOCOL'
  })
  
  const [scope1Entries, setScope1Entries] = useState<EmissionEntry[]>([])
  const [scope2Entries, setScope2Entries] = useState<EmissionEntry[]>([])
  const [scope3Entries, setScope3Entries] = useState<EmissionEntry[]>([])
  
  const [emissionFactors, setEmissionFactors] = useState<any>({})
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [activeTab, setActiveTab] = useState("assessment")

  // Load emission factor categories on mount
  useEffect(() => {
    loadEmissionFactorCategories()
  }, [])

  const loadEmissionFactorCategories = async () => {
    try {
      const response = await carbonCalculatorApi.getEmissionFactorCategories()
      setEmissionFactors(response.scopes)
    } catch (error: any) {
      console.error('Failed to load emission factors:', error)
      toast({
        title: "Error",
        description: "Failed to load emission factors. Please refresh the page.",
        variant: "destructive",
      })
    }
  }

  // Add new emission entry
  const addEmissionEntry = (scope: 1 | 2 | 3) => {
    const newEntry: EmissionEntry = {
      id: `${scope}-${Date.now()}`,
      activityData: 0,
      activityUnit: '',
      facilityName: '',
      notes: ''
    }

    if (scope === 1) {
      newEntry.sourceCategory = 'stationary_combustion'
      setScope1Entries([...scope1Entries, newEntry])
    } else if (scope === 2) {
      newEntry.energyType = 'electricity'
      newEntry.calculationMethod = 'location_based'
      setScope2Entries([...scope2Entries, newEntry])
    } else {
      newEntry.categoryNumber = 1
      newEntry.dataQuality = 3
      setScope3Entries([...scope3Entries, newEntry])
    }
  }

  // Remove emission entry
  const removeEmissionEntry = (scope: 1 | 2 | 3, id: string) => {
    if (scope === 1) {
      setScope1Entries(scope1Entries.filter(e => e.id !== id))
    } else if (scope === 2) {
      setScope2Entries(scope2Entries.filter(e => e.id !== id))
    } else {
      setScope3Entries(scope3Entries.filter(e => e.id !== id))
    }
  }

  // Update emission entry
  const updateEmissionEntry = (scope: 1 | 2 | 3, id: string, field: string, value: any) => {
    const updateEntry = (entries: EmissionEntry[]) =>
      entries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )

    if (scope === 1) {
      setScope1Entries(updateEntry(scope1Entries))
    } else if (scope === 2) {
      setScope2Entries(updateEntry(scope2Entries))
    } else {
      setScope3Entries(updateEntry(scope3Entries))
    }
  }

  // Calculate carbon footprint
  const calculateFootprint = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to calculate your carbon footprint.",
        variant: "destructive",
      })
      return
    }

    if (!assessmentData.organizationName) {
      toast({
        title: "Organization Name Required",
        description: "Please enter your organization name.",
        variant: "destructive",
      })
      return
    }

    setCalculating(true)
    
    try {
      const calculationData = {
        assessment: assessmentData,
        scope1Data: scope1Entries.filter(e => e.activityData > 0),
        scope2Data: scope2Entries.filter(e => e.activityData > 0),
        scope3Data: scope3Entries.filter(e => e.activityData > 0),
        region: 'US' // Could be made configurable
      }

      const response = await carbonCalculatorApi.calculateFootprint(calculationData)
      setResult(response)
      setActiveTab("results")
      
      toast({
        title: "Calculation Complete",
        description: `Total emissions: ${response.summary.totalEmissions.toFixed(2)} tCO₂e`,
      })
    } catch (error: any) {
      console.error('Calculation failed:', error)
      toast({
        title: "Calculation Failed",
        description: error.message || "Please check your data and try again.",
        variant: "destructive",
      })
    } finally {
      setCalculating(false)
    }
  }

  // Get scope 3 category name
  const getScope3CategoryName = (categoryNumber: number) => {
    const categories = {
      1: "Purchased Goods & Services",
      2: "Capital Goods",
      3: "Fuel & Energy Related Activities",
      4: "Upstream Transportation",
      5: "Waste Generated in Operations",
      6: "Business Travel",
      7: "Employee Commuting",
      8: "Upstream Leased Assets",
      9: "Downstream Transportation",
      10: "Processing of Sold Products",
      11: "Use of Sold Products",
      12: "End-of-Life Treatment",
      13: "Downstream Leased Assets",
      14: "Franchises",
      15: "Investments"
    }
    return categories[categoryNumber as keyof typeof categories] || `Category ${categoryNumber}`
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="glass-card p-8 mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Carbon Footprint <span className="gradient-text">Calculator</span>
          </h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Calculate your organization's carbon emissions across Scope 1, 2, and 3 with our scientifically accurate assessment
            tool based on EPA, DEFRA, and IPCC emission factors. Get blockchain verification and earn sustainability rewards.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 glass">
            <TabsTrigger value="assessment">Assessment Info</TabsTrigger>
            <TabsTrigger value="scope1">Scope 1</TabsTrigger>
            <TabsTrigger value="scope2">Scope 2</TabsTrigger>
            <TabsTrigger value="scope3">Scope 3</TabsTrigger>
            <TabsTrigger value="results" disabled={!result}>Results</TabsTrigger>
          </TabsList>

          {/* Assessment Information */}
          <TabsContent value="assessment" className="space-y-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Assessment Information</CardTitle>
                <p className="text-sm text-gray-400">Basic information about your carbon assessment</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      value={assessmentData.organizationName}
                      onChange={(e) => setAssessmentData({...assessmentData, organizationName: e.target.value})}
                      placeholder="Enter organization name"
                      className="glass border-white/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Assessment Year</Label>
                    <Select
                      value={assessmentData.assessmentYear.toString()}
                      onValueChange={(value) => setAssessmentData({...assessmentData, assessmentYear: parseInt(value)})}
                    >
                      <SelectTrigger className="glass border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="startDate">Reporting Period Start</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={assessmentData.reportingPeriodStart}
                      onChange={(e) => setAssessmentData({...assessmentData, reportingPeriodStart: e.target.value})}
                      className="glass border-white/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Reporting Period End</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={assessmentData.reportingPeriodEnd}
                      onChange={(e) => setAssessmentData({...assessmentData, reportingPeriodEnd: e.target.value})}
                      className="glass border-white/20"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="boundary">Assessment Boundary</Label>
                  <Select
                    value={assessmentData.assessmentBoundary}
                    onValueChange={(value) => setAssessmentData({...assessmentData, assessmentBoundary: value})}
                  >
                    <SelectTrigger className="glass border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operational Control">Operational Control</SelectItem>
                      <SelectItem value="Financial Control">Financial Control</SelectItem>
                      <SelectItem value="Equity Share">Equity Share</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setActiveTab("scope1")} className="bg-green-600 hover:bg-green-700">
                Continue to Scope 1 <TrendingUp className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Scope 1 - Direct Emissions */}
          <TabsContent value="scope1" className="space-y-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-red-500/20 text-red-400">Scope 1</Badge>
                      Direct Emissions
                    </CardTitle>
                    <p className="text-sm text-gray-400">Emissions from sources owned or controlled by your organization</p>
                  </div>
                  <Button onClick={() => addEmissionEntry(1)} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Source
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {scope1Entries.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No Scope 1 emission sources added yet.</p>
                    <p className="text-sm">Add fuel combustion, vehicle emissions, or refrigerant leaks.</p>
                  </div>
                ) : (
                  scope1Entries.map((entry, index) => (
                    <Card key={entry.id} className="glass-strong border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Source {index + 1}</h4>
                          <Button
                            onClick={() => removeEmissionEntry(1, entry.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Source Category</Label>
                            <Select
                              value={entry.sourceCategory}
                              onValueChange={(value) => updateEmissionEntry(1, entry.id, 'sourceCategory', value)}
                            >
                              <SelectTrigger className="glass border-white/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="stationary_combustion">Stationary Combustion</SelectItem>
                                <SelectItem value="mobile_combustion">Mobile Combustion</SelectItem>
                                <SelectItem value="process">Process Emissions</SelectItem>
                                <SelectItem value="fugitive">Fugitive Emissions</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Fuel Type</Label>
                            <Input
                              value={entry.fuelType || ''}
                              onChange={(e) => updateEmissionEntry(1, entry.id, 'fuelType', e.target.value)}
                              placeholder="e.g., natural_gas_commercial"
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Activity Data</Label>
                            <Input
                              type="number"
                              value={entry.activityData}
                              onChange={(e) => updateEmissionEntry(1, entry.id, 'activityData', parseFloat(e.target.value) || 0)}
                              placeholder="Consumption amount"
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Select
                              value={entry.activityUnit}
                              onValueChange={(value) => updateEmissionEntry(1, entry.id, 'activityUnit', value)}
                            >
                              <SelectTrigger className="glass border-white/20">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gallon">Gallons</SelectItem>
                                <SelectItem value="liter">Liters</SelectItem>
                                <SelectItem value="MMBtu">MMBtu</SelectItem>
                                <SelectItem value="kWh">kWh</SelectItem>
                                <SelectItem value="kg">Kilograms</SelectItem>
                                <SelectItem value="tonne">Tonnes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Facility Name</Label>
                            <Input
                              value={entry.facilityName || ''}
                              onChange={(e) => updateEmissionEntry(1, entry.id, 'facilityName', e.target.value)}
                              placeholder="Optional"
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={entry.location || ''}
                              onChange={(e) => updateEmissionEntry(1, entry.id, 'location', e.target.value)}
                              placeholder="Optional"
                              className="glass border-white/20"
                            />
                          </div>
                        </div>
                        {entry.notes !== undefined && (
                          <div className="mt-4">
                            <Label>Notes</Label>
                            <Textarea
                              value={entry.notes}
                              onChange={(e) => updateEmissionEntry(1, entry.id, 'notes', e.target.value)}
                              placeholder="Additional notes..."
                              className="glass border-white/20"
                              rows={2}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setActiveTab("assessment")} variant="outline">
                Back
              </Button>
              <Button onClick={() => setActiveTab("scope2")} className="bg-green-600 hover:bg-green-700">
                Continue to Scope 2 <TrendingUp className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Scope 2 - Indirect Energy */}
          <TabsContent value="scope2" className="space-y-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400">Scope 2</Badge>
                      Indirect Energy Emissions
                    </CardTitle>
                    <p className="text-sm text-gray-400">Emissions from purchased electricity, steam, heating, and cooling</p>
                  </div>
                  <Button onClick={() => addEmissionEntry(2)} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Energy Source
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {scope2Entries.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No Scope 2 emission sources added yet.</p>
                    <p className="text-sm">Add electricity, steam, heating, or cooling consumption.</p>
                  </div>
                ) : (
                  scope2Entries.map((entry, index) => (
                    <Card key={entry.id} className="glass-strong border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Energy Source {index + 1}</h4>
                          <Button
                            onClick={() => removeEmissionEntry(2, entry.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Energy Type</Label>
                            <Select
                              value={entry.energyType}
                              onValueChange={(value) => updateEmissionEntry(2, entry.id, 'energyType', value)}
                            >
                              <SelectTrigger className="glass border-white/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="electricity">Electricity</SelectItem>
                                <SelectItem value="steam">Steam</SelectItem>
                                <SelectItem value="heating">Heating</SelectItem>
                                <SelectItem value="cooling">Cooling</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Calculation Method</Label>
                            <Select
                              value={entry.calculationMethod}
                              onValueChange={(value) => updateEmissionEntry(2, entry.id, 'calculationMethod', value)}
                            >
                              <SelectTrigger className="glass border-white/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="location_based">Location-based</SelectItem>
                                <SelectItem value="market_based">Market-based</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Activity Data</Label>
                            <Input
                              type="number"
                              value={entry.activityData}
                              onChange={(e) => updateEmissionEntry(2, entry.id, 'activityData', parseFloat(e.target.value) || 0)}
                              placeholder="Energy consumption"
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Select
                              value={entry.activityUnit}
                              onValueChange={(value) => updateEmissionEntry(2, entry.id, 'activityUnit', value)}
                            >
                              <SelectTrigger className="glass border-white/20">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kWh">kWh</SelectItem>
                                <SelectItem value="MWh">MWh</SelectItem>
                                <SelectItem value="MMBtu">MMBtu</SelectItem>
                                <SelectItem value="GJ">Gigajoules</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Grid Region</Label>
                            <Select
                              value={entry.gridRegion || ''}
                              onValueChange={(value) => updateEmissionEntry(2, entry.id, 'gridRegion', value)}
                            >
                              <SelectTrigger className="glass border-white/20">
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="grid_us_national">US National Average</SelectItem>
                                <SelectItem value="grid_california">California</SelectItem>
                                <SelectItem value="grid_texas">Texas</SelectItem>
                                <SelectItem value="grid_new_york">New York</SelectItem>
                                <SelectItem value="grid_uk">United Kingdom</SelectItem>
                                <SelectItem value="grid_germany">Germany</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Facility Name</Label>
                            <Input
                              value={entry.facilityName || ''}
                              onChange={(e) => updateEmissionEntry(2, entry.id, 'facilityName', e.target.value)}
                              placeholder="Optional"
                              className="glass border-white/20"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setActiveTab("scope1")} variant="outline">
                Back
              </Button>
              <Button onClick={() => setActiveTab("scope3")} className="bg-green-600 hover:bg-green-700">
                Continue to Scope 3 <TrendingUp className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Scope 3 - Other Indirect */}
          <TabsContent value="scope3" className="space-y-6">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-400">Scope 3</Badge>
                      Other Indirect Emissions
                    </CardTitle>
                    <p className="text-sm text-gray-400">Emissions from your value chain (upstream and downstream activities)</p>
                  </div>
                  <Button onClick={() => addEmissionEntry(3)} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {scope3Entries.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No Scope 3 emission categories added yet.</p>
                    <p className="text-sm">Add business travel, purchased goods, waste, or other value chain activities.</p>
                  </div>
                ) : (
                  scope3Entries.map((entry, index) => (
                    <Card key={entry.id} className="glass-strong border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">
                            {getScope3CategoryName(entry.categoryNumber || 1)}
                          </h4>
                          <Button
                            onClick={() => removeEmissionEntry(3, entry.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Category</Label>
                            <Select
                              value={entry.categoryNumber?.toString()}
                              onValueChange={(value) => updateEmissionEntry(3, entry.id, 'categoryNumber', parseInt(value))}
                            >
                              <SelectTrigger className="glass border-white/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({length: 15}, (_, i) => i + 1).map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}. {getScope3CategoryName(num)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Activity Data</Label>
                            <Input
                              type="number"
                              value={entry.activityData}
                              onChange={(e) => updateEmissionEntry(3, entry.id, 'activityData', parseFloat(e.target.value) || 0)}
                              placeholder="Amount or spend"
                              className="glass border-white/20"
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Select
                              value={entry.activityUnit}
                              onValueChange={(value) => updateEmissionEntry(3, entry.id, 'activityUnit', value)}
                            >
                              <SelectTrigger className="glass border-white/20">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">Kilograms</SelectItem>
                                <SelectItem value="passenger_km">Passenger-km</SelectItem>
                                <SelectItem value="USD">USD (spend-based)</SelectItem>
                                <SelectItem value="room_night">Room nights</SelectItem>
                                <SelectItem value="m3">Cubic meters</SelectItem>
                                <SelectItem value="tonne">Tonnes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Data Quality (1-5)</Label>
                            <Select
                              value={entry.dataQuality?.toString()}
                              onValueChange={(value) => updateEmissionEntry(3, entry.id, 'dataQuality', parseInt(value))}
                            >
                              <SelectTrigger className="glass border-white/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 - Low quality</SelectItem>
                                <SelectItem value="2">2 - Below average</SelectItem>
                                <SelectItem value="3">3 - Average</SelectItem>
                                <SelectItem value="4">4 - Good quality</SelectItem>
                                <SelectItem value="5">5 - High quality</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setActiveTab("scope2")} variant="outline">
                Back
              </Button>
              <Button 
                onClick={calculateFootprint} 
                disabled={calculating}
                className="bg-green-600 hover:bg-green-700"
              >
                {calculating ? (
                  <>Calculating...</>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Footprint
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Results */}
          <TabsContent value="results" className="space-y-6">
            {result && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="glass-card border-green-500/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        {result.summary.totalEmissions.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">Total tCO₂e</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-red-500/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-red-400 mb-2">
                        {result.summary.scope1Total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">Scope 1 ({result.summary.emissionsByScope.scope1}%)</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-blue-500/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-2">
                        {result.summary.scope2Total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">Scope 2 ({result.summary.emissionsByScope.scope2}%)</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border-purple-500/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-2">
                        {result.summary.scope3Total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">Scope 3 ({result.summary.emissionsByScope.scope3}%)</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Confidence Score */}
                <Card className="glass-card border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Data Quality & Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span>Confidence Level</span>
                          <span>{result.summary.averageConfidence}%</span>
                        </div>
                        <Progress value={result.summary.averageConfidence} className="h-3" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{result.summary.averageConfidence}%</div>
                        <div className="text-xs text-gray-400">Confidence</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Insights */}
                {result.insights.length > 0 && (
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        Key Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.insights.map((insight, index) => (
                        <Alert key={index} className="glass-strong border-yellow-500/20">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <Badge variant="outline" className="mr-2">
                              {insight.priority.toUpperCase()}
                            </Badge>
                            {insight.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <Card className="glass-card border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-400" />
                        Reduction Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.recommendations.map((rec, index) => (
                        <div key={index} className="glass-strong p-4 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Scope {rec.scope}</Badge>
                              <h4 className="font-medium">{rec.action}</h4>
                            </div>
                            <Badge variant="outline" className="text-green-400">
                              {rec.potentialReduction} reduction
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">{rec.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit for Verification
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
