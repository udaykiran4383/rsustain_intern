"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Save, 
  AlertTriangle,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Building,
  MapPin,
  Phone
} from "lucide-react"
import { api, type User as UserType } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface UserSettings {
  // Profile Information
  company_name: string
  full_name: string
  email: string
  phone_number: string
  address: string
  country: string
  business_details: {
    industry?: string
    size?: string
    website?: string
    tax_id?: string
  }
  
  // Notification Preferences
  notification_preferences: {
    email_notifications: boolean
    in_app_alerts: boolean
    marketing_emails: boolean
    transaction_alerts: boolean
    price_alerts: boolean
    weekly_reports: boolean
  }
  
  // Security Settings
  security_settings: {
    two_factor_enabled: boolean
    password_change_required: boolean
    session_timeout: number
  }
  
  // Trading Preferences
  trading_preferences: {
    auto_retirement: boolean
    preferred_certifications: string[]
    preferred_project_types: string[]
    price_alert_threshold: number
    default_quantity: number
  }
}

export function Settings() {
  const { user, userProfile } = useAuth()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<UserSettings>({
    company_name: "",
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    country: "",
    business_details: {},
    notification_preferences: {
      email_notifications: true,
      in_app_alerts: true,
      marketing_emails: false,
      transaction_alerts: true,
      price_alerts: false,
      weekly_reports: true
    },
    security_settings: {
      two_factor_enabled: false,
      password_change_required: false,
      session_timeout: 60
    },
    trading_preferences: {
      auto_retirement: false,
      preferred_certifications: [],
      preferred_project_types: [],
      price_alert_threshold: 50,
      default_quantity: 10
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const certifications = ["VERRA", "GOLD_STANDARD", "CARBON_CREDIT_STANDARD", "AMERICAN_CARBON_REGISTRY"]
  const projectTypes = ["reforestation", "renewable_energy", "energy_efficiency", "methane_capture", "ocean_conservation"]
  const countries = ["US", "CA", "UK", "DE", "FR", "AU", "IN", "JP", "BR", "MX"]
  const industries = ["Technology", "Manufacturing", "Finance", "Healthcare", "Retail", "Energy", "Transportation", "Agriculture", "Other"]
  const companySizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"]

  useEffect(() => {
    if (user && userProfile) {
      loadUserSettings()
    }
  }, [user, userProfile])

  const loadUserSettings = async () => {
    if (!user || !userProfile) return

    setLoading(true)
    try {
      setSettings({
        company_name: userProfile.company_name || "",
        full_name: userProfile.full_name || "",
        email: user.email || "",
        phone_number: userProfile.phone_number || "",
        address: userProfile.address || "",
        country: userProfile.country || "",
        business_details: userProfile.business_details || {},
        notification_preferences: userProfile.notification_preferences || {
          email_notifications: true,
          in_app_alerts: true,
          marketing_emails: false,
          transaction_alerts: true,
          price_alerts: false,
          weekly_reports: true
        },
        security_settings: userProfile.security_settings || {
          two_factor_enabled: false,
          password_change_required: false,
          session_timeout: 60
        },
        trading_preferences: {
          auto_retirement: false,
          preferred_certifications: [],
          preferred_project_types: [],
          price_alert_threshold: 50,
          default_quantity: 10
        }
      })
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (section: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const saveSettings = async () => {
    if (!user) return

    setSaving(true)
    try {
      const updateData = {
        company_name: settings.company_name,
        full_name: settings.full_name,
        phone_number: settings.phone_number,
        address: settings.address,
        country: settings.country,
        business_details: settings.business_details,
        notification_preferences: settings.notification_preferences,
        security_settings: settings.security_settings
      }

      await api.updateUserProfile(user.id, updateData)

      // Log activity
      await api.logActivity({
        user_id: user.id,
        activity_type: "settings_updated",
        description: "Updated account settings",
        metadata: {
          sections_updated: [activeTab]
        }
      })

      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    try {
      // In a real implementation, this would call the auth service
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      })
    }
  }

  const enable2FA = async () => {
    try {
      // In a real implementation, this would set up 2FA
      updateSettings("security_settings", "two_factor_enabled", true)
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
      })
    } catch (error) {
      toast({
        title: "2FA Setup Failed",
        description: "Failed to enable two-factor authentication. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
          <p className="text-gray-400">Manage your profile, preferences, and security settings</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="bg-green-600 hover:bg-green-700">
          {saving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={settings.company_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                    className="glass border-white/20"
                    placeholder="Your Company Ltd."
                  />
                </div>
                <div>
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    value={settings.full_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, full_name: e.target.value }))}
                    className="glass border-white/20"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    disabled
                    className="glass border-white/20 bg-gray-800"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Contact support if needed.</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone_number}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="glass border-white/20"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  className="glass border-white/20"
                  placeholder="123 Business Street, City, State"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={settings.country} onValueChange={(value) => setSettings(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger className="glass border-white/20">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select 
                    value={settings.business_details.industry} 
                    onValueChange={(value) => updateSettings("business_details", "industry", value)}
                  >
                    <SelectTrigger className="glass border-white/20">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="company-size">Company Size</Label>
                  <Select 
                    value={settings.business_details.size} 
                    onValueChange={(value) => updateSettings("business_details", "size", value)}
                  >
                    <SelectTrigger className="glass border-white/20">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size} value={size}>{size} employees</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.business_details.website || ""}
                    onChange={(e) => updateSettings("business_details", "website", e.target.value)}
                    className="glass border-white/20"
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input
                    id="tax-id"
                    value={settings.business_details.tax_id || ""}
                    onChange={(e) => updateSettings("business_details", "tax_id", e.target.value)}
                    className="glass border-white/20"
                    placeholder="123-45-6789"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-400">Receive important updates via email</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.email_notifications}
                  onCheckedChange={(checked) => updateSettings("notification_preferences", "email_notifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">In-App Alerts</h4>
                  <p className="text-sm text-gray-400">Show notifications in the application</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.in_app_alerts}
                  onCheckedChange={(checked) => updateSettings("notification_preferences", "in_app_alerts", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Marketing Emails</h4>
                  <p className="text-sm text-gray-400">Receive product updates and promotional content</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.marketing_emails}
                  onCheckedChange={(checked) => updateSettings("notification_preferences", "marketing_emails", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Transaction Alerts</h4>
                  <p className="text-sm text-gray-400">Get notified about purchase confirmations and failures</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.transaction_alerts}
                  onCheckedChange={(checked) => updateSettings("notification_preferences", "transaction_alerts", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Price Alerts</h4>
                  <p className="text-sm text-gray-400">Notify when carbon credit prices change significantly</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.price_alerts}
                  onCheckedChange={(checked) => updateSettings("notification_preferences", "price_alerts", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Weekly Reports</h4>
                  <p className="text-sm text-gray-400">Receive weekly portfolio and market summaries</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.weekly_reports}
                  onCheckedChange={(checked) => updateSettings("notification_preferences", "weekly_reports", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                </div>
                <div className="flex items-center gap-2">
                  {!settings.security_settings.two_factor_enabled ? (
                    <Button onClick={enable2FA} size="sm" variant="outline">
                      Enable 2FA
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Enabled</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Change Password</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="glass border-white/20 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="glass border-white/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="glass border-white/20"
                    />
                  </div>

                  <Button onClick={changePassword} variant="outline">
                    Change Password
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Select 
                  value={settings.security_settings.session_timeout.toString()} 
                  onValueChange={(value) => updateSettings("security_settings", "session_timeout", parseInt(value))}
                >
                  <SelectTrigger className="glass border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Preferences */}
        <TabsContent value="trading" className="space-y-6">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Trading Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-Retirement</h4>
                  <p className="text-sm text-gray-400">Automatically retire purchased credits</p>
                </div>
                <Switch
                  checked={settings.trading_preferences.auto_retirement}
                  onCheckedChange={(checked) => updateSettings("trading_preferences", "auto_retirement", checked)}
                />
              </div>

              <Separator />

              <div>
                <Label>Preferred Certifications</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {certifications.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={cert}
                        checked={settings.trading_preferences.preferred_certifications.includes(cert)}
                        onChange={(e) => {
                          const current = settings.trading_preferences.preferred_certifications
                          const updated = e.target.checked
                            ? [...current, cert]
                            : current.filter(c => c !== cert)
                          updateSettings("trading_preferences", "preferred_certifications", updated)
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={cert} className="text-sm">{cert}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Preferred Project Types</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {projectTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={type}
                        checked={settings.trading_preferences.preferred_project_types.includes(type)}
                        onChange={(e) => {
                          const current = settings.trading_preferences.preferred_project_types
                          const updated = e.target.checked
                            ? [...current, type]
                            : current.filter(t => t !== type)
                          updateSettings("trading_preferences", "preferred_project_types", updated)
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={type} className="text-sm">{type.replace('_', ' ')}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price-alert">Price Alert Threshold ($)</Label>
                  <Input
                    id="price-alert"
                    type="number"
                    value={settings.trading_preferences.price_alert_threshold}
                    onChange={(e) => updateSettings("trading_preferences", "price_alert_threshold", parseFloat(e.target.value))}
                    className="glass border-white/20"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-400 mt-1">Alert when prices change by this amount</p>
                </div>
                <div>
                  <Label htmlFor="default-quantity">Default Purchase Quantity</Label>
                  <Input
                    id="default-quantity"
                    type="number"
                    value={settings.trading_preferences.default_quantity}
                    onChange={(e) => updateSettings("trading_preferences", "default_quantity", parseInt(e.target.value))}
                    className="glass border-white/20"
                    min="1"
                  />
                  <p className="text-xs text-gray-400 mt-1">Default number of credits to purchase</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Keep your account secure by enabling two-factor authentication and using a strong password. 
          Never share your login credentials with anyone.
        </AlertDescription>
      </Alert>
    </div>
  )
} 