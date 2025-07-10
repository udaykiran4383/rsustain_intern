import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

// Create client instances
export const supabase = typeof window !== 'undefined' 
  ? createClientComponentClient() 
  : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

// Service role client for admin operations (only use server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Enhanced database types
export interface User {
  id: string
  email: string
  role: "buyer" | "seller" | "verifier" | "admin"
  company_name?: string
  country?: string
  full_name?: string
  phone_number?: string
  address?: string
  business_details?: Record<string, any>
  notification_preferences?: {
    email_notifications: boolean
    in_app_alerts: boolean
  }
  security_settings?: {
    two_factor_enabled: boolean
  }
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  location: string
  project_type: "reforestation" | "renewable_energy" | "energy_efficiency" | "methane_capture" | "ocean_conservation"
  certification: "VERRA" | "GOLD_STANDARD" | "CARBON_CREDIT_STANDARD" | "AMERICAN_CARBON_REGISTRY"
  total_credits: number
  available_credits: number
  price_per_credit: number
  risk_score?: number
  sdg_goals?: string[]
  vintage_year?: number
  seller_id?: string
  status: "draft" | "pending_verification" | "verified" | "rejected" | "active" | "completed"
  verification_status: "not_submitted" | "submitted" | "in_review" | "approved" | "rejected"
  impact_story?: string
  media_gallery?: string[]
  certification_details?: Record<string, any>
  project_documents?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  user_id: string
  project_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
  projects?: Project
}

export interface Credit {
  id: string
  project_id: string
  vintage_year: number
  quantity: number
  price: number
  status: "available" | "reserved" | "sold" | "retired"
  buyer_id?: string
  retirement_reason?: string
  retirement_date?: string
  certificate_id?: string
  created_at: string
  updated_at: string
  projects?: Project
}

export interface Transaction {
  id: string
  buyer_id: string
  seller_id: string
  project_id: string
  quantity: number
  price_per_credit: number
  total_amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  payment_intent_id?: string
  payment_method?: string
  payment_status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
  projects?: Project
}

export interface Certificate {
  id: string
  certificate_type: "retirement" | "verification" | "purchase"
  user_id: string
  project_id?: string
  transaction_id?: string
  credit_id?: string
  certificate_number: string
  quantity?: number
  issue_date: string
  pdf_url?: string
  verification_seal?: string
  metadata?: Record<string, any>
  created_at: string
  projects?: Project
}

export interface Verification {
  id: string
  project_id: string
  verifier_id?: string
  status: "pending" | "in_review" | "approved" | "rejected" | "revision_requested"
  priority: "low" | "medium" | "high"
  comments?: string
  findings?: string
  supporting_evidence_url?: string
  decision_reason?: string
  verification_date?: string
  assigned_date?: string
  created_at: string
  projects?: Project
  verifier?: User
}

export interface ProjectDocument {
  id: string
  project_id: string
  document_name: string
  document_type: string
  file_url: string
  file_size?: number
  mime_type?: string
  version: number
  uploaded_by: string
  status: "uploaded" | "reviewed" | "approved" | "rejected"
  reviewer_comments?: string
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  activity_type: string
  description: string
  metadata?: Record<string, any>
  project_id?: string
  transaction_id?: string
  created_at: string
  projects?: Project
}

export interface RiskScore {
  id: string
  project_id: string
  environmental_risk?: number
  social_risk?: number
  governance_risk?: number
  overall_risk?: number
  methodology?: string
  ai_analysis?: Record<string, any>
  calculated_at: string
}

export interface KnowledgeBase {
  id: string
  title: string
  content: string
  category: string
  tags?: string[]
  target_roles?: string[]
  featured: boolean
  view_count: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SupportTicket {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in_progress" | "resolved" | "closed"
  assigned_to?: string
  resolution?: string
  created_at: string
  updated_at: string
}

export interface PaymentRecord {
  id: string
  user_id: string
  transaction_id: string
  amount: number
  currency: string
  payment_method: string
  payment_status: "pending" | "processing" | "completed" | "failed" | "refunded"
  stripe_payment_intent_id?: string
  receipt_url?: string
  created_at: string
}

export interface CreditIssuance {
  id: string
  project_id: string
  buyer_id: string
  quantity: number
  issuance_date: string
  status: "issued" | "pending_verification"
  verification_status?: string
  created_at: string
  projects?: Project
  buyer?: User
}

// Enhanced API functions
export const api = {
  // User Management
  getUserProfile: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()
    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
    return data
  },

  updateUserProfile: async (userId: string, updates: Partial<User>): Promise<User | null> => {
    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()
    if (error) {
      console.error("Error updating user profile:", error)
      return null
    }
    return data
  },

  // Cart Management
  getCartItems: async (userId: string): Promise<CartItem[]> => {
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        *,
        projects (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching cart items:", error)
      return []
    }
    return data || []
  },

  addToCart: async (userId: string, projectId: string, quantity: number): Promise<CartItem | null> => {
    // First get the project to calculate price
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("price_per_credit")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      console.error("Error fetching project for cart:", projectError)
      return null
    }

    const unitPrice = project.price_per_credit
    const totalPrice = quantity * unitPrice

    const { data, error } = await supabase
      .from("cart_items")
      .upsert({
        user_id: userId,
        project_id: projectId,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding to cart:", error)
      return null
    }
    return data
  },

  updateCartItem: async (cartItemId: string, quantity: number): Promise<CartItem | null> => {
    // Get current cart item to recalculate total
    const { data: cartItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("unit_price")
      .eq("id", cartItemId)
      .single()

    if (fetchError || !cartItem) {
      console.error("Error fetching cart item:", fetchError)
      return null
    }

    const totalPrice = quantity * cartItem.unit_price

    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity, total_price: totalPrice })
      .eq("id", cartItemId)
      .select()
      .single()

    if (error) {
      console.error("Error updating cart item:", error)
      return null
    }
    return data
  },

  removeFromCart: async (cartItemId: string): Promise<boolean> => {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId)
    if (error) {
      console.error("Error removing from cart:", error)
      return false
    }
    return true
  },

  clearCart: async (userId: string): Promise<boolean> => {
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId)
    if (error) {
      console.error("Error clearing cart:", error)
      return false
    }
    return true
  },

  // Project Management
  getProjects: async (filters?: {
    status?: string[]
    projectType?: string[]
    certification?: string[]
    region?: string
    priceRange?: [number, number]
  }): Promise<Project[]> => {
    let query = supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })

    if (filters?.status) {
      query = query.in("status", filters.status)
    } else {
      query = query.in("status", ["verified", "active"])
    }

    if (filters?.projectType) {
      query = query.in("project_type", filters.projectType)
    }

    if (filters?.certification) {
      query = query.in("certification", filters.certification)
    }

    if (filters?.priceRange) {
      query = query.gte("price_per_credit", filters.priceRange[0])
        .lte("price_per_credit", filters.priceRange[1])
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching projects:", error)
      return []
    }
    return data || []
  },

  getProject: async (id: string): Promise<Project | null> => {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()
    if (error) {
      console.error("Error fetching project:", error)
      return null
    }
    return data
  },

  createProject: async (project: Partial<Project>): Promise<Project | null> => {
    const { data, error } = await supabase.from("projects").insert([project]).select().single()
    if (error) {
      console.error("Error creating project:", error)
      return null
    }
    return data
  },

  updateProject: async (id: string, updates: Partial<Project>): Promise<Project | null> => {
    const { data, error } = await supabase.from("projects").update(updates).eq("id", id).select().single()
    if (error) {
      console.error("Error updating project:", error)
      return null
    }
    return data
  },

  getSellerProjects: async (sellerId: string): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching seller projects:", error)
      return []
    }
    return data || []
  },

  // Credit Management
  getCredits: async (): Promise<Credit[]> => {
    const { data, error } = await supabase
      .from("credits")
      .select(`
        *,
        projects (*)
      `)
      .eq("status", "available")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching credits:", error)
      return []
    }
    return data || []
  },

  getUserCredits: async (userId: string): Promise<Credit[]> => {
    const { data, error } = await supabase
      .from("credits")
      .select(`
        *,
        projects (*)
      `)
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user credits:", error)
      return []
    }
    return data || []
  },

  retireCredits: async (creditId: string, reason: string): Promise<Credit | null> => {
    const { data, error } = await supabase
      .from("credits")
      .update({
        status: "retired",
        retirement_reason: reason,
        retirement_date: new Date().toISOString()
      })
      .eq("id", creditId)
      .select()
      .single()

    if (error) {
      console.error("Error retiring credits:", error)
      return null
    }
    return data
  },

  // Transaction Management
  getTransactions: async (userId?: string, role?: string): Promise<Transaction[]> => {
    let query = supabase
      .from("transactions")
      .select(`
        *,
        projects (*)
      `)
      .order("created_at", { ascending: false })

    if (userId && role) {
      if (role === "buyer") {
        query = query.eq("buyer_id", userId)
      } else if (role === "seller") {
        query = query.eq("seller_id", userId)
      }
    } else if (userId) {
      query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching transactions:", error)
      return []
    }
    return data || []
  },

  createTransaction: async (transaction: Partial<Transaction>): Promise<Transaction | null> => {
    const { data, error } = await supabase.from("transactions").insert([transaction]).select().single()
    if (error) {
      console.error("Error creating transaction:", error)
      return null
    }
    return data
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
    const { data, error } = await supabase.from("transactions").update(updates).eq("id", id).select().single()
    if (error) {
      console.error("Error updating transaction:", error)
      return null
    }
    return data
  },

  // Certificate Management
  getCertificates: async (userId: string): Promise<Certificate[]> => {
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        *,
        projects (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching certificates:", error)
      return []
    }
    return data || []
  },

  createCertificate: async (certificate: Partial<Certificate>): Promise<Certificate | null> => {
    const { data, error } = await supabase.from("certificates").insert([certificate]).select().single()
    if (error) {
      console.error("Error creating certificate:", error)
      return null
    }
    return data
  },

  // Verification Management
  getVerifications: async (verifierId?: string): Promise<Verification[]> => {
    let query = supabase
      .from("verifications")
      .select(`
        *,
        projects (*),
        verifier:users!verifications_verifier_id_fkey (*)
      `)
      .order("created_at", { ascending: false })

    if (verifierId) {
      query = query.eq("verifier_id", verifierId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching verifications:", error)
      return []
    }
    return data || []
  },

  getVerificationQueue: async (): Promise<Verification[]> => {
    const { data, error } = await supabase
      .from("verifications")
      .select(`
        *,
        projects (*)
      `)
      .in("status", ["pending", "in_review"])
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching verification queue:", error)
      return []
    }
    return data || []
  },

  assignVerification: async (verificationId: string, verifierId: string): Promise<Verification | null> => {
    const { data, error } = await supabase
      .from("verifications")
      .update({
        verifier_id: verifierId,
        status: "in_review",
        assigned_date: new Date().toISOString()
      })
      .eq("id", verificationId)
      .select()
      .single()

    if (error) {
      console.error("Error assigning verification:", error)
      return null
    }
    return data
  },

  updateVerification: async (id: string, updates: Partial<Verification>): Promise<Verification | null> => {
    const { data, error } = await supabase.from("verifications").update(updates).eq("id", id).select().single()
    if (error) {
      console.error("Error updating verification:", error)
      return null
    }
    return data
  },

  // Activity Logging
  logActivity: async (activity: Partial<ActivityLog>): Promise<ActivityLog | null> => {
    const { data, error } = await supabase.from("activity_logs").insert([activity]).select().single()
    if (error) {
      console.error("Error logging activity:", error)
      return null
    }
    return data
  },

  getActivityLogs: async (userId: string, limit: number = 50): Promise<ActivityLog[]> => {
    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        *,
        projects (name)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching activity logs:", error)
      return []
    }
    return data || []
  },

  // Knowledge Base
  getKnowledgeBase: async (category?: string, targetRole?: string): Promise<KnowledgeBase[]> => {
    let query = supabase
      .from("knowledge_base")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })

    if (category) {
      query = query.eq("category", category)
    }

    if (targetRole) {
      query = query.contains("target_roles", [targetRole])
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching knowledge base:", error)
      return []
    }
    return data || []
  },

  // Support Tickets
  getSupportTickets: async (userId?: string): Promise<SupportTicket[]> => {
    let query = supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching support tickets:", error)
      return []
    }
    return data || []
  },

  createSupportTicket: async (ticket: Partial<SupportTicket>): Promise<SupportTicket | null> => {
    const { data, error } = await supabase.from("support_tickets").insert([ticket]).select().single()
    if (error) {
      console.error("Error creating support ticket:", error)
      return null
    }
    return data
  },

  // Statistics and Analytics
  getPlatformStats: async () => {
    try {
      const [projectsResult, creditsResult, transactionsResult, usersResult] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact" }).in("status", ["verified", "active"]),
        supabase.from("credits").select("quantity").eq("status", "sold"),
        supabase.from("transactions").select("total_amount").eq("status", "completed"),
        supabase.from("users").select("id", { count: "exact" })
      ])

      const totalProjects = projectsResult.count || 0
      const totalCreditsTraded = creditsResult.data?.reduce((sum, credit) => sum + credit.quantity, 0) || 0
      const totalValue = transactionsResult.data?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0
      const totalUsers = usersResult.count || 0

      return {
        totalCreditsTraded,
        activeProjects: totalProjects,
        communityRiskScore: 7.8, // Will be calculated from actual data
        totalUsers,
        totalValue
      }
    } catch (error) {
      console.error("Error fetching platform stats:", error)
      return {
        totalCreditsTraded: 0,
        activeProjects: 0,
        communityRiskScore: 0,
        totalUsers: 0,
        totalValue: 0
      }
    }
  },

  getUserStats: async (userId: string, role: string) => {
    try {
      if (role === "buyer") {
        const [creditsResult, transactionsResult] = await Promise.all([
          supabase.from("credits").select("quantity").eq("buyer_id", userId),
          supabase.from("transactions").select("total_amount").eq("buyer_id", userId).eq("status", "completed")
        ])

        const totalCredits = creditsResult.data?.reduce((sum, credit) => sum + credit.quantity, 0) || 0
        const portfolioValue = transactionsResult.data?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0
        const creditsRetired = Math.floor(totalCredits * 0.3) // Mock calculation
        const carbonOffset = (totalCredits * 0.85).toFixed(1)

        return {
          totalCredits,
          portfolioValue,
          creditsRetired,
          carbonOffset: parseFloat(carbonOffset)
        }
      } else if (role === "seller") {
        const [projectsResult, salesResult] = await Promise.all([
          supabase.from("projects").select("id", { count: "exact" }).eq("seller_id", userId),
          supabase.from("transactions").select("total_amount, quantity").eq("seller_id", userId).eq("status", "completed")
        ])

        const totalProjects = projectsResult.count || 0
        const totalSales = salesResult.data?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0
        const creditsSold = salesResult.data?.reduce((sum, tx) => sum + tx.quantity, 0) || 0

        return {
          totalProjects,
          totalSales,
          creditsSold
        }
      } else if (role === "verifier") {
        const [verificationsResult] = await Promise.all([
          supabase.from("verifications").select("status").eq("verifier_id", userId)
        ])

        const totalVerifications = verificationsResult.data?.length || 0
        const approvedVerifications = verificationsResult.data?.filter(v => v.status === "approved").length || 0

        return {
          totalVerifications,
          approvedVerifications,
          approvalRate: totalVerifications > 0 ? Math.round((approvedVerifications / totalVerifications) * 100) : 0
        }
      }

      return {}
    } catch (error) {
      console.error("Error fetching user stats:", error)
      return {}
    }
  },

  // Carbon Calculator (existing function)
  calculateEmissions: async (data: any): Promise<number> => {
    const { scope1, scope2, scope3 } = data
    return (scope1 || 0) + (scope2 || 0) + (scope3 || 0)
  },

  // Risk Assessment
  calculateRiskScore: async (projectId: string): Promise<number> => {
    // TODO: Implement AI-powered risk assessment
    return Math.random() * 10
  },

  getRiskScores: async (projectId: string): Promise<RiskScore | null> => {
    const { data, error } = await supabase
      .from("risk_scores")
      .select("*")
      .eq("project_id", projectId)
      .order("calculated_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching risk scores:", error)
      return null
    }

    return data?.[0] || null
  }
}

// Carbon Calculator API functions
export const carbonCalculatorApi = {
  // Calculate carbon footprint
  async calculateFootprint(data: {
    assessment: {
      organizationName: string
      assessmentYear: number
      reportingPeriodStart: string
      reportingPeriodEnd: string
      assessmentBoundary: string
      methodology: string
    }
    scope1Data?: any[]
    scope2Data?: any[]
    scope3Data?: any[]
    region?: string
  }) {
    const response = await fetch('/api/carbon-calculator/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Calculation failed')
    }

    return response.json()
  },

  // Get emission factors
  async getEmissionFactors(params?: {
    category?: string
    scope?: number
    region?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.set('category', params.category)
    if (params?.scope) searchParams.set('scope', params.scope.toString())
    if (params?.region) searchParams.set('region', params.region)
    if (params?.search) searchParams.set('search', params.search)

    const response = await fetch(`/api/carbon-calculator/emission-factors?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch emission factors')
    }

    return response.json()
  },

  // Get emission factor categories
  async getEmissionFactorCategories() {
    const response = await fetch('/api/carbon-calculator/emission-factors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'get_categories' }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch categories')
    }

    return response.json()
  },

  // Get user assessments
  async getAssessments() {
    const response = await fetch('/api/carbon-calculator/assessments')
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch assessments')
    }

    return response.json()
  },

  // Get specific assessment with details
  async getAssessment(id: string, includeDetails = false) {
    const params = new URLSearchParams({ id })
    if (includeDetails) params.set('details', 'true')

    const response = await fetch(`/api/carbon-calculator/assessments?${params}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch assessment')
    }

    return response.json()
  },

  // Update assessment verification status
  async updateAssessment(assessmentId: string, action: string, verificationData?: any) {
    const response = await fetch('/api/carbon-calculator/assessments', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assessmentId, action, verificationData }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update assessment')
    }

    return response.json()
  },

  // Delete assessment
  async deleteAssessment(id: string) {
    const response = await fetch(`/api/carbon-calculator/assessments?id=${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete assessment')
    }

    return response.json()
  },

  // ===== SELLER FUNCTIONS =====
  
  // Get seller projects
  async getSellerProjects(sellerId: string) {
    const response = await fetch(`/api/seller?action=get_projects&seller_id=${sellerId}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch seller projects')
    }

    return response.json()
  },

  // Create new project
  async createProject(projectData: Partial<Project> & { seller_id: string }) {
    const response = await fetch('/api/seller', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create_project',
        project_data: projectData
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create project')
    }

    return response.json()
  },

  // Update existing project
  async updateProject(projectId: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from("projects")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", projectId)
      .select()

    if (error) throw error
    return data[0]
  },

  // Create verification record
  async createVerification(verificationData: Partial<Verification> & { project_id: string }) {
    const { data, error } = await supabase
      .from("verifications")
      .insert({
        ...verificationData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error
    return data[0]
  },

  // Get user activity
  async getUserActivity(userId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        *,
        projects (
          name,
          project_type
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  // Log activity
  async logActivity(activityData: Partial<ActivityLog> & { 
    user_id: string
    activity_type: string
    description: string
  }) {
    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        ...activityData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error
    return data[0]
  },

  // Get project documents
  async getProjectDocuments(projectId: string) {
    const { data, error } = await supabase
      .from("project_documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  // Upload project document
  async uploadProjectDocument(documentData: Partial<ProjectDocument> & {
    project_id: string
    document_name: string
    document_type: string
    file_url: string
    uploaded_by: string
  }) {
    const { data, error } = await supabase
      .from("project_documents")
      .insert({
        ...documentData,
        id: crypto.randomUUID(),
        version: 1,
        status: "uploaded",
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error
    return data[0]
  },

  // Get project sales data
  async getProjectSalesData(projectId: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        projects (
          name,
          project_type,
          price_per_credit
        )
      `)
      .eq("project_id", projectId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get seller revenue summary
  async getSellerRevenueSummary(sellerId: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        total_amount,
        quantity,
        created_at,
        projects!inner (
          seller_id
        )
      `)
      .eq("projects.seller_id", sellerId)
      .eq("status", "completed")

    if (error) throw error
    
    const totalRevenue = data?.reduce((sum, t) => sum + t.total_amount, 0) || 0
    const totalCreditsSold = data?.reduce((sum, t) => sum + t.quantity, 0) || 0
    
    return {
      total_revenue: totalRevenue,
      total_credits_sold: totalCreditsSold,
      transaction_count: data?.length || 0,
      average_price: totalCreditsSold > 0 ? totalRevenue / totalCreditsSold : 0
    }
  },

  // ===== VERIFIER FUNCTIONS =====
  
  // Get verification queue
  async getVerificationQueue() {
    const response = await fetch('/api/verifier?action=get_queue')
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch verification queue')
    }

    return response.json()
  },

  // Assign verification to verifier
  async assignVerification(verificationId: string, verifierId: string) {
    const response = await fetch('/api/verifier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'assign',
        verification_id: verificationId,
        verifier_id: verifierId
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to assign verification')
    }

    return response.json()
  },

  // Update verification priority
  async updateVerificationPriority(verificationId: string, priority: "low" | "medium" | "high") {
    const { data, error } = await supabase
      .from("verifications")
      .update({ priority })
      .eq("id", verificationId)
      .select()

    if (error) throw error
    return data[0]
  },

  // Get verifier assignments
  async getVerifierAssignments(verifierId: string) {
    const { data, error } = await supabase
      .from("verifications")
      .select(`
        *,
        projects (
          id,
          name,
          description,
          location,
          project_type,
          certification,
          total_credits,
          price_per_credit,
          vintage_year
        )
      `)
      .eq("verifier_id", verifierId)
      .in("status", ["in_review", "revision_requested"])
      .order("assigned_date", { ascending: true })

    if (error) throw error
    return data || []
  },

  // Update verification status
  async updateVerificationStatus(verificationId: string, status: string, data?: {
    comments?: string
    findings?: string
    decision_reason?: string
  }) {
    const updateData: any = {
      status,
      ...data
    }

    if (status === "approved" || status === "rejected") {
      updateData.verification_date = new Date().toISOString()
    }

    const { data: result, error } = await supabase
      .from("verifications")
      .update(updateData)
      .eq("id", verificationId)
      .select()

    if (error) throw error
    return result[0]
  },

  // Get verification history for verifier
  async getVerifierHistory(verifierId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from("verifications")
      .select(`
        *,
        projects (
          name,
          project_type,
          certification
        )
      `)
      .eq("verifier_id", verifierId)
      .in("status", ["approved", "rejected"])
      .order("verification_date", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  // Get verification details for review
  async getVerificationDetails(verificationId: string) {
    const { data, error } = await supabase
      .from("verifications")
      .select(`
        *,
        projects (
          *,
          project_documents (
            *
          )
        ),
        verifier:profiles!verifier_id (
          id,
          full_name,
          email
        )
      `)
      .eq("id", verificationId)
      .single()

    if (error) throw error
    return data
  }
}

// Add certificate and credit retirement functions to the main API
export const certificateApi = {
  // Create certificate
  async createCertificate(data: {
    certificate_type: "retirement" | "verification" | "purchase"
    user_id: string
    project_id?: string
    transaction_id?: string
    credit_id?: string
    certificate_number: string
    quantity?: number
    metadata?: Record<string, any>
  }) {
    const { data: result, error } = await supabase
      .from("certificates")
      .insert(data)
      .select()

    if (error) throw error
    return result[0]
  },

  // Get user certificates
  async getUserCertificates(userId: string, type?: string) {
    let query = supabase
      .from("certificates")
      .select(`
        *,
        projects (
          name,
          project_type,
          certification
        )
      `)
      .eq("user_id", userId)

    if (type) {
      query = query.eq("certificate_type", type)
    }

    const { data, error } = await query.order("issue_date", { ascending: false })

    if (error) throw error
    return data || []
  },

  // Update certificate
  async updateCertificate(certificateId: string, updates: Partial<Certificate>) {
    const { data, error } = await supabase
      .from("certificates")
      .update(updates)
      .eq("id", certificateId)
      .select()

    if (error) throw error
    return data[0]
  },

  // Generate certificate PDF
  async generateCertificatePDF(certificateId: string) {
    // This would integrate with a PDF generation service
    // For now, return a placeholder URL
    return `https://certificates.rsustain.com/${certificateId}.pdf`
  },

  // Retire credits
  async retireCredits(data: {
    transaction_id: string
    reason: string
    quantity: number
    beneficiary?: string
    notes?: string
  }) {
    const { data: result, error } = await supabase
      .from("credits")
      .insert({
        project_id: data.transaction_id, // This will need to be updated based on transaction
        vintage_year: new Date().getFullYear(),
        quantity: data.quantity,
        price: 0, // Will be set from transaction
        status: "retired",
        retirement_reason: data.reason,
        retirement_date: new Date().toISOString()
      })
      .select()

    if (error) throw error
    return result[0]
  },

  // Get user retired credits
  async getUserRetiredCredits(userId: string) {
    const { data, error } = await supabase
      .from("credits")
      .select(`
        *,
        projects (
          name,
          project_type,
          certification,
          location
        )
      `)
      .eq("buyer_id", userId)
      .eq("status", "retired")
      .order("retirement_date", { ascending: false })

    if (error) throw error
    return data || []
  }
}

// Add these functions to the main api object
Object.assign(api, {
  getUserCertificates: certificateApi.getUserCertificates,
  createCertificate: certificateApi.createCertificate,
  updateCertificate: certificateApi.updateCertificate,
  generateCertificatePDF: certificateApi.generateCertificatePDF,
  retireCredits: certificateApi.retireCredits,
  getUserRetiredCredits: certificateApi.getUserRetiredCredits
})
