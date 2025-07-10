import { NextRequest, NextResponse } from 'next/server'
import { carbonCalculator, Scope1Input, Scope2Input, Scope3Input, AssessmentInput } from '@/lib/carbon-calculator'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Calculate carbon footprint for a complete assessment
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user if authenticated (allow anonymous calculations)
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { 
      assessment, 
      scope1Data = [], 
      scope2Data = [], 
      scope3Data = [],
      region = 'US',
      // Support for simple calculations
      fuelType,
      consumption,
      unit,
      sourceCategory
    } = body

    // Check if this is a simple calculation request
    if (fuelType && consumption !== undefined && unit) {
      try {
        const consumptionValue = parseFloat(consumption)
        
        // Validate consumption value
        if (isNaN(consumptionValue) || consumptionValue < 0) {
          return NextResponse.json(
            { error: 'Consumption must be a positive number' }, 
            { status: 400 }
          )
        }

        if (consumptionValue > 1000000) {
          return NextResponse.json(
            { error: 'Consumption value is unreasonably large. Please verify your input.' }, 
            { status: 400 }
          )
        }

        // Handle simple calculation for workflow tests
        const scope1Input = {
          sourceCategory: (sourceCategory || 'stationary_combustion') as 'stationary_combustion' | 'mobile_combustion' | 'process' | 'fugitive',
          fuelType,
          activityData: consumptionValue,
          activityUnit: unit
        }
        const result = await carbonCalculator.calculateScope1(scope1Input, region)

        return NextResponse.json({
          totalEmissions: result.totalEmissions,
          emissionFactor: result.emissionFactor,
          calculation: result,
          note: 'Simple calculation mode'
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: `Calculation failed: ${error.message}` }, 
          { status: 400 }
        )
      }
    }

    // Validate assessment data for full assessment mode
    if (!assessment || !assessment.organizationName || !assessment.assessmentYear) {
      return NextResponse.json(
        { error: 'Assessment organization name and year are required for full assessment mode' }, 
        { status: 400 }
      )
    }

    // Validate reporting period
    const startDate = new Date(assessment.reportingPeriodStart)
    const endDate = new Date(assessment.reportingPeriodEnd)
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Reporting period start must be before end date' }, 
        { status: 400 }
      )
    }

    // Calculate emissions for each scope
    const scope1Results = []
    const scope2Results = []
    const scope3Results = []

    // Process Scope 1 emissions
    for (const scope1Input of scope1Data) {
      if (!scope1Input.fuelType || !scope1Input.activityData || !scope1Input.activityUnit) {
        return NextResponse.json(
          { error: 'Scope 1 data missing required fields: fuelType, activityData, activityUnit' }, 
          { status: 400 }
        )
      }

      try {
        const result = await carbonCalculator.calculateScope1(scope1Input, region)
        scope1Results.push(result)
      } catch (error: any) {
        return NextResponse.json(
          { error: `Scope 1 calculation failed: ${error.message}` }, 
          { status: 400 }
        )
      }
    }

    // Process Scope 2 emissions
    for (const scope2Input of scope2Data) {
      if (!scope2Input.energyType || !scope2Input.activityData || !scope2Input.activityUnit) {
        return NextResponse.json(
          { error: 'Scope 2 data missing required fields: energyType, activityData, activityUnit' }, 
          { status: 400 }
        )
      }

      try {
        const result = await carbonCalculator.calculateScope2(scope2Input, region)
        scope2Results.push(result)
      } catch (error: any) {
        return NextResponse.json(
          { error: `Scope 2 calculation failed: ${error.message}` }, 
          { status: 400 }
        )
      }
    }

    // Process Scope 3 emissions
    for (const scope3Input of scope3Data) {
      if (!scope3Input.categoryNumber || !scope3Input.activityData || !scope3Input.activityUnit) {
        return NextResponse.json(
          { error: 'Scope 3 data missing required fields: categoryNumber, activityData, activityUnit' }, 
          { status: 400 }
        )
      }

      try {
        const result = await carbonCalculator.calculateScope3(scope3Input, region)
        scope3Results.push(result)
      } catch (error: any) {
        return NextResponse.json(
          { error: `Scope 3 calculation failed: ${error.message}` }, 
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const scope1Total = scope1Results.reduce((sum, r) => sum + r.totalEmissions, 0)
    const scope2Total = scope2Results.reduce((sum, r) => sum + r.totalEmissions, 0)
    const scope3Total = scope3Results.reduce((sum, r) => sum + r.totalEmissions, 0)
    const totalEmissions = scope1Total + scope2Total + scope3Total

    // Calculate confidence metrics
    const allResults = [...scope1Results, ...scope2Results, ...scope3Results]
    const avgConfidence = allResults.length > 0 
      ? allResults.reduce((sum, r) => sum + r.confidenceLevel, 0) / allResults.length 
      : 0

    // Save to database (if user is authenticated)
    let assessmentId: string | null = null
    if (user?.id) {
      try {
        assessmentId = await carbonCalculator.saveAssessment(
          assessment,
          scope1Results,
          scope2Results,
          scope3Results,
          user.id
        )
      } catch (error: any) {
        console.error('Failed to save assessment:', error)
        // Continue to return results even if save fails
      }
    }

    // Prepare response
    const response = {
      assessmentId,
      summary: {
        scope1Total: Math.round(scope1Total * 100) / 100,
        scope2Total: Math.round(scope2Total * 100) / 100,
        scope3Total: Math.round(scope3Total * 100) / 100,
        totalEmissions: Math.round(totalEmissions * 100) / 100,
        averageConfidence: Math.round(avgConfidence),
        emissionsByScope: {
          scope1: scope1Total > 0 ? Math.round((scope1Total / totalEmissions) * 100) : 0,
          scope2: scope2Total > 0 ? Math.round((scope2Total / totalEmissions) * 100) : 0,
          scope3: scope3Total > 0 ? Math.round((scope3Total / totalEmissions) * 100) : 0
        }
      },
      details: {
        scope1Results,
        scope2Results,
        scope3Results
      },
      insights: generateInsights(scope1Total, scope2Total, scope3Total, avgConfidence),
      recommendations: generateRecommendations(scope1Results, scope2Results, scope3Results)
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Carbon calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error during calculation' }, 
      { status: 500 }
    )
  }
}

// Generate insights based on calculation results
function generateInsights(scope1: number, scope2: number, scope3: number, confidence: number) {
  const total = scope1 + scope2 + scope3
  const insights = []

  // Scope distribution insights
  if (scope2 / total > 0.6) {
    insights.push({
      type: 'scope_distribution',
      message: 'Scope 2 (purchased energy) represents over 60% of your emissions. Consider renewable energy options.',
      priority: 'high'
    })
  }

  if (scope3 / total > 0.7) {
    insights.push({
      type: 'scope_distribution',
      message: 'Scope 3 (value chain) represents over 70% of your emissions. Focus on supply chain improvements.',
      priority: 'high'
    })
  }

  if (scope1 / total > 0.5) {
    insights.push({
      type: 'scope_distribution',
      message: 'Scope 1 (direct) emissions are significant. Consider fuel switching or efficiency improvements.',
      priority: 'medium'
    })
  }

  // Data quality insights
  if (confidence < 60) {
    insights.push({
      type: 'data_quality',
      message: 'Data confidence is below 60%. Consider improving data collection for more accurate results.',
      priority: 'medium'
    })
  }

  // Emission level insights
  if (total > 1000) {
    insights.push({
      type: 'emission_level',
      message: 'Total emissions exceed 1,000 tCO2e. Consider setting science-based targets for reduction.',
      priority: 'high'
    })
  }

  return insights
}

// Generate recommendations based on emission sources
function generateRecommendations(scope1: any[], scope2: any[], scope3: any[]) {
  const recommendations = []

  // Scope 1 recommendations
  if (scope1.length > 0) {
    const totalScope1 = scope1.reduce((sum, r) => sum + r.totalEmissions, 0)
    if (totalScope1 > 50) {
      recommendations.push({
        scope: 1,
        action: 'Energy Efficiency',
        description: 'Upgrade to more efficient equipment and improve building insulation',
        potentialReduction: '10-30%',
        priority: 'medium'
      })
    }
  }

  // Scope 2 recommendations
  if (scope2.length > 0) {
    const totalScope2 = scope2.reduce((sum, r) => sum + r.totalEmissions, 0)
    if (totalScope2 > 100) {
      recommendations.push({
        scope: 2,
        action: 'Renewable Energy',
        description: 'Switch to renewable energy sources or purchase renewable energy certificates',
        potentialReduction: '50-90%',
        priority: 'high'
      })
    }
  }

  // Scope 3 recommendations
  if (scope3.length > 0) {
    const totalScope3 = scope3.reduce((sum, r) => sum + r.totalEmissions, 0)
    if (totalScope3 > 200) {
      recommendations.push({
        scope: 3,
        action: 'Supply Chain Engagement',
        description: 'Work with suppliers to reduce their emissions and improve data quality',
        potentialReduction: '20-40%',
        priority: 'high'
      })
    }
  }

  return recommendations
} 