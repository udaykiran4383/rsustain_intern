"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface RiskMetric {
  category: string
  score: number
  maxScore: number
  status: string
  color: string
}

export function RiskAssessment() {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [overallRisk, setOverallRisk] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    const fetchRiskData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Fetch user's transactions and project risk scores
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select(`
            credits_purchased,
            projects!inner (
              risk_score,
              project_type
            ),
            risk_scores (
              environmental_risk,
              social_risk,
              governance_risk,
              overall_risk
            )
          `)
          .eq('buyer_id', user.id)
          .eq('status', 'completed')

        if (error) {
          console.error('Error fetching risk data:', error)
          setLoading(false)
          return
        }

        if (!transactions || transactions.length === 0) {
          // Set default low risk if no transactions
          const defaultMetrics: RiskMetric[] = [
            {
              category: "Environmental Risk",
              score: 1.0,
              maxScore: 10,
              status: "Very Low",
              color: "text-green-400",
            },
            {
              category: "Social Risk",
              score: 1.0,
              maxScore: 10,
              status: "Very Low",
              color: "text-green-400",
            },
            {
              category: "Governance Risk",
              score: 1.0,
              maxScore: 10,
              status: "Very Low",
              color: "text-green-400",
            },
            {
              category: "Market Risk",
              score: 1.0,
              maxScore: 10,
              status: "Very Low",
              color: "text-green-400",
            },
          ]
          setRiskMetrics(defaultMetrics)
          setOverallRisk(1.0)
          setLoading(false)
          return
        }

        // Calculate weighted average risk scores based on portfolio
        let totalCredits = 0
        let weightedEnvRisk = 0
        let weightedSocialRisk = 0
        let weightedGovRisk = 0
        let weightedOverallRisk = 0

        transactions.forEach((transaction: any) => {
          const credits = transaction.credits_purchased
          const riskScore = transaction.projects?.risk_score || 2.0
          const riskScores = transaction.risk_scores?.[0]

          totalCredits += credits
          
          // Use risk_scores if available, otherwise derive from overall risk_score
          weightedEnvRisk += credits * (riskScores?.environmental_risk || riskScore * 0.8)
          weightedSocialRisk += credits * (riskScores?.social_risk || riskScore * 0.9)
          weightedGovRisk += credits * (riskScores?.governance_risk || riskScore * 0.7)
          weightedOverallRisk += credits * (riskScores?.overall_risk || riskScore)
        })

        if (totalCredits > 0) {
          const envRisk = weightedEnvRisk / totalCredits
          const socialRisk = weightedSocialRisk / totalCredits
          const govRisk = weightedGovRisk / totalCredits
          const overall = weightedOverallRisk / totalCredits

          const getStatus = (score: number) => {
            if (score <= 2) return { status: "Very Low", color: "text-green-400" }
            if (score <= 4) return { status: "Low", color: "text-green-400" }
            if (score <= 6) return { status: "Medium", color: "text-yellow-400" }
            if (score <= 8) return { status: "High", color: "text-orange-400" }
            return { status: "Very High", color: "text-red-400" }
          }

          const metrics: RiskMetric[] = [
            {
              category: "Environmental Risk",
              score: envRisk,
              maxScore: 10,
              ...getStatus(envRisk),
            },
            {
              category: "Social Risk",
              score: socialRisk,
              maxScore: 10,
              ...getStatus(socialRisk),
            },
            {
              category: "Governance Risk",
              score: govRisk,
              maxScore: 10,
              ...getStatus(govRisk),
            },
            {
              category: "Market Risk",
              score: overall * 1.2, // Slightly higher for market risk
              maxScore: 10,
              ...getStatus(overall * 1.2),
            },
          ]

          setRiskMetrics(metrics)
          setOverallRisk(overall)
        }
      } catch (error) {
        console.error('Error fetching risk data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRiskData()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="text-center">
                <div className="h-12 bg-gray-700 rounded mb-2 mx-auto w-24"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-2 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{overallRisk.toFixed(1)}/10</div>
            <div className="text-sm text-gray-400">Overall Risk Score</div>
            <Progress value={(10 - overallRisk) * 10} className="mt-4" />
          </div>

          <div className="space-y-4">
            {riskMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{metric.category}</span>
                  <span className={`text-sm ${metric.color}`}>{metric.status}</span>
                </div>
                <Progress value={(metric.maxScore - metric.score) * 10} className="h-2" />
                <div className="text-xs text-gray-400 text-right">
                  {metric.score.toFixed(1)}/{metric.maxScore}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert className="glass border-yellow-400/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {overallRisk <= 3 
            ? "Your portfolio shows low risk. Great diversification across verified projects."
            : overallRisk <= 6
            ? "Your portfolio shows medium risk. Consider diversifying across different project types."
            : "Your portfolio shows higher risk. Review your investments and consider more stable projects."
          }
        </AlertDescription>
      </Alert>

      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <span>Consider adding more renewable energy projects</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <span>Diversify across different geographical regions</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
              <span>Monitor vintage year distribution</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
