// Carbon Footprint Calculation Engine
// Based on GHG Protocol Corporate Accounting and Reporting Standard

import { supabase } from './supabase'

// Types for calculation inputs
export interface Scope1Input {
  sourceCategory: 'stationary_combustion' | 'mobile_combustion' | 'process' | 'fugitive'
  fuelType: string
  activityData: number
  activityUnit: string
  facilityName?: string
  location?: string
  notes?: string
}

export interface Scope2Input {
  energyType: 'electricity' | 'steam' | 'heating' | 'cooling'
  calculationMethod: 'location_based' | 'market_based'
  activityData: number
  activityUnit: string
  gridRegion?: string
  facilityName?: string
  utilityProvider?: string
  renewableEnergyCertificates?: number
  supplierEmissionFactor?: number
  notes?: string
}

export interface Scope3Input {
  categoryNumber: number
  categoryName: string
  calculationMethod: 'spend_based' | 'activity_based' | 'hybrid'
  activityData: number
  activityUnit: string
  dataQuality: 1 | 2 | 3 | 4 | 5
  estimationMethod?: string
  notes?: string
}

export interface AssessmentInput {
  organizationName: string
  assessmentYear: number
  reportingPeriodStart: string
  reportingPeriodEnd: string
  assessmentBoundary: string
  methodology: string
}

// Calculation results
export interface EmissionResult {
  co2Emissions: number
  ch4Emissions: number
  n2oEmissions: number
  otherGhgEmissions: number
  totalEmissions: number
  emissionFactor: number
  emissionFactorSource: string
  confidenceLevel: number
}

export class CarbonCalculator {
  
  // Get emission factor from database
  async getEmissionFactor(
    category: string, 
    subcategory: string, 
    scope: number, 
    region: string = 'GLOBAL'
  ): Promise<any> {
    try {
      // Try region-specific factor first, fallback to global
      const { data, error } = await supabase
        .from('emission_factors')
        .select('*')
        .eq('category', category)
        .eq('subcategory', subcategory)
        .eq('scope', scope)
        .in('region', [region, 'GLOBAL'])
        .order('region', { ascending: false }) // Prefer specific region over GLOBAL
        .limit(1)
        .single()

      if (error) {
        // If table doesn't exist, use mock data
        if (error.message?.includes('does not exist')) {
          return this.getMockEmissionFactor(category, subcategory, scope, region)
        }
        throw error
      }

      if (!data) {
        throw new Error(`Emission factor not found for ${category}/${subcategory} in scope ${scope}`)
      }

      return data
    } catch (error: any) {
      throw new Error(`Emission factor not found for ${category}/${subcategory} in scope ${scope}`)
    }
  }

  // Get mock emission factor when database is not available
  private getMockEmissionFactor(category: string, subcategory: string, scope: number, region: string): any {
    const mockFactors = [
      // Scope 1 - Direct Emissions
      {
        id: 'mock-1',
        category: 'fuel',
        subcategory: 'natural_gas_commercial',
        scope: 1,
        emission_factor: 53.02,
        unit: 'MMBtu',
        source: 'EPA 2023',
        methodology: 'AP-42',
        gwp_ar5: true,
        region: 'US',
        year: 2023
      },
      {
        id: 'mock-1b',
        category: 'fuel',
        subcategory: 'natural_gas',
        scope: 1,
        emission_factor: 53.02,
        unit: 'MMBtu',
        source: 'EPA 2023',
        methodology: 'AP-42',
        gwp_ar5: true,
        region: 'US',
        year: 2023
      },
      {
        id: 'mock-2',
        category: 'fuel',
        subcategory: 'gasoline_motor',
        scope: 1,
        emission_factor: 19.59,
        unit: 'gallon',
        source: 'EPA 2023',
        methodology: 'AP-42',
        gwp_ar5: true,
        region: 'US',
        year: 2023
      },
      {
        id: 'mock-2b',
        category: 'fuel',
        subcategory: 'gasoline',
        scope: 1,
        emission_factor: 19.59,
        unit: 'gallon',
        source: 'EPA 2023',
        methodology: 'AP-42',
        gwp_ar5: true,
        region: 'US',
        year: 2023
      },
      {
        id: 'mock-2c',
        category: 'fuel',
        subcategory: 'diesel',
        scope: 1,
        emission_factor: 22.51,
        unit: 'gallon',
        source: 'EPA 2023',
        methodology: 'AP-42',
        gwp_ar5: true,
        region: 'US',
        year: 2023
      },
      // Scope 2 - Electricity
      {
        id: 'mock-3',
        category: 'electricity',
        subcategory: 'grid_us_national',
        scope: 2,
        emission_factor: 0.8554,
        unit: 'kWh',
        source: 'EPA 2023',
        methodology: 'eGRID',
        gwp_ar5: true,
        region: 'US',
        year: 2023
      }
    ]

    const factor = mockFactors.find(f => 
      f.category === category && 
      f.subcategory === subcategory && 
      f.scope === scope &&
      (f.region === region || f.region === 'GLOBAL' || region === 'GLOBAL')
    )

    if (!factor) {
      throw new Error(`Mock emission factor not found for ${category}/${subcategory} in scope ${scope}`)
    }

    return factor
  }

  // Calculate Scope 1 emissions
  async calculateScope1(input: Scope1Input, region: string = 'US'): Promise<EmissionResult> {
    try {
      // Get appropriate emission factor
      const factor = await this.getEmissionFactor(
        input.sourceCategory === 'mobile_combustion' ? 'transport' : 'fuel',
        input.fuelType,
        1,
        region
      )

      // Convert units if necessary
      const normalizedActivity = await this.convertUnits(
        input.activityData,
        input.activityUnit,
        factor.unit
      )

      // Calculate total emissions (kg CO2e)
      const totalEmissionsKg = normalizedActivity * factor.emission_factor

      // For most fuels, assume 98% CO2, 1% CH4, 1% N2O (simplified)
      const co2Emissions = totalEmissionsKg * 0.98
      const ch4Emissions = totalEmissionsKg * 0.01
      const n2oEmissions = totalEmissionsKg * 0.01

      // Convert to tonnes CO2e
      const result: EmissionResult = {
        co2Emissions: co2Emissions / 1000,
        ch4Emissions: ch4Emissions / 1000,
        n2oEmissions: n2oEmissions / 1000,
        otherGhgEmissions: 0,
        totalEmissions: totalEmissionsKg / 1000,
        emissionFactor: factor.emission_factor,
        emissionFactorSource: factor.source,
        confidenceLevel: this.calculateConfidenceLevel(factor, input.activityUnit)
      }

      return result
    } catch (error) {
      console.error('Scope 1 calculation error:', error)
      throw new Error(`Failed to calculate Scope 1 emissions: ${error}`)
    }
  }

  // Calculate Scope 2 emissions
  async calculateScope2(input: Scope2Input, region: string = 'US'): Promise<EmissionResult> {
    try {
      let emissionFactor: number
      let factorSource: string

      if (input.calculationMethod === 'market_based' && input.supplierEmissionFactor) {
        emissionFactor = input.supplierEmissionFactor
        factorSource = 'Supplier-specific'
      } else {
        // Location-based method
        const gridType = this.determineGridType(region, input.gridRegion)
        const factor = await this.getEmissionFactor('electricity', gridType, 2, region)
        emissionFactor = factor.emission_factor
        factorSource = factor.source
      }

      // Convert units if necessary (usually kWh)
      const normalizedActivity = await this.convertUnits(
        input.activityData,
        input.activityUnit,
        'kWh'
      )

      // Account for RECs if provided
      const adjustedActivity = input.renewableEnergyCertificates 
        ? Math.max(0, normalizedActivity - (input.renewableEnergyCertificates * 1000)) // Convert MWh to kWh
        : normalizedActivity

      // Calculate emissions (kg CO2e)
      const totalEmissionsKg = adjustedActivity * emissionFactor

      const result: EmissionResult = {
        co2Emissions: totalEmissionsKg / 1000, // Assume all CO2 for electricity
        ch4Emissions: 0,
        n2oEmissions: 0,
        otherGhgEmissions: 0,
        totalEmissions: totalEmissionsKg / 1000,
        emissionFactor,
        emissionFactorSource: factorSource,
        confidenceLevel: input.calculationMethod === 'market_based' ? 90 : 75
      }

      return result
    } catch (error) {
      console.error('Scope 2 calculation error:', error)
      throw new Error(`Failed to calculate Scope 2 emissions: ${error}`)
    }
  }

  // Calculate Scope 3 emissions
  async calculateScope3(input: Scope3Input, region: string = 'GLOBAL'): Promise<EmissionResult> {
    try {
      // Map category number to category name for factor lookup
      const categoryMapping = this.getScope3CategoryMapping()
      const factorCategory = categoryMapping[input.categoryNumber]

      if (!factorCategory) {
        throw new Error(`Invalid Scope 3 category: ${input.categoryNumber}`)
      }

      // Get emission factor based on calculation method
      let emissionFactor: number
      let factorSource: string

      if (input.calculationMethod === 'spend_based') {
        // Use spend-based emission factors ($ per tCO2e)
        const factor = await this.getEmissionFactor(
          'spend_based',
          factorCategory.subcategory,
          3,
          region
        )
        emissionFactor = factor.emission_factor
        factorSource = factor.source
      } else {
        // Activity-based calculation
        const factor = await this.getEmissionFactor(
          factorCategory.category,
          factorCategory.subcategory,
          3,
          region
        )
        emissionFactor = factor.emission_factor
        factorSource = factor.source
      }

      // Convert units if necessary
      const normalizedActivity = await this.convertUnits(
        input.activityData,
        input.activityUnit,
        factorCategory.unit
      )

      // Calculate emissions (kg CO2e)
      const totalEmissionsKg = normalizedActivity * emissionFactor

      // Apply data quality adjustment
      const qualityMultiplier = this.getDataQualityMultiplier(input.dataQuality)
      const adjustedEmissions = totalEmissionsKg * qualityMultiplier

      const result: EmissionResult = {
        co2Emissions: adjustedEmissions / 1000,
        ch4Emissions: 0,
        n2oEmissions: 0,
        otherGhgEmissions: 0,
        totalEmissions: adjustedEmissions / 1000,
        emissionFactor,
        emissionFactorSource: factorSource,
        confidenceLevel: this.calculateScope3Confidence(input.calculationMethod, input.dataQuality)
      }

      return result
    } catch (error) {
      console.error('Scope 3 calculation error:', error)
      throw new Error(`Failed to calculate Scope 3 emissions: ${error}`)
    }
  }

  // Save complete assessment to database
  async saveAssessment(
    assessmentInput: AssessmentInput,
    scope1Results: EmissionResult[],
    scope2Results: EmissionResult[],
    scope3Results: EmissionResult[],
    userId: string
  ): Promise<string> {
    try {
      // Calculate totals
      const scope1Total = scope1Results.reduce((sum, r) => sum + r.totalEmissions, 0)
      const scope2Total = scope2Results.reduce((sum, r) => sum + r.totalEmissions, 0)
      const scope3Total = scope3Results.reduce((sum, r) => sum + r.totalEmissions, 0)
      const totalEmissions = scope1Total + scope2Total + scope3Total

      // Calculate overall confidence and data quality
      const allResults = [...scope1Results, ...scope2Results, ...scope3Results]
      const avgConfidence = allResults.reduce((sum, r) => sum + r.confidenceLevel, 0) / allResults.length
      const dataQualityScore = this.calculateOverallDataQuality(allResults)

      // Create assessment record
      const { data: assessment, error: assessmentError } = await supabase
        .from('carbon_assessments')
        .insert({
          user_id: userId,
          organization_name: assessmentInput.organizationName,
          assessment_year: assessmentInput.assessmentYear,
          reporting_period_start: assessmentInput.reportingPeriodStart,
          reporting_period_end: assessmentInput.reportingPeriodEnd,
          assessment_boundary: assessmentInput.assessmentBoundary,
          methodology: assessmentInput.methodology,
          scope1_total: scope1Total,
          scope2_total: scope2Total,
          scope3_total: scope3Total,
          total_emissions: totalEmissions,
          confidence_level: avgConfidence,
          data_quality_score: dataQualityScore
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError

      const assessmentId = assessment.id

      // Save detailed scope emissions in parallel
      await Promise.all([
        this.saveScope1Details(assessmentId, scope1Results),
        this.saveScope2Details(assessmentId, scope2Results),
        this.saveScope3Details(assessmentId, scope3Results)
      ])

      return assessmentId
    } catch (error) {
      console.error('Save assessment error:', error)
      throw new Error(`Failed to save assessment: ${error}`)
    }
  }

  // Helper methods
  private async convertUnits(value: number, fromUnit: string, toUnit: string): Promise<number> {
    if (fromUnit === toUnit) return value

    // Define conversion factors
    const conversions: { [key: string]: { [key: string]: number } } = {
      // Energy conversions
      'kWh': { 'MWh': 0.001, 'GWh': 0.000001, 'MMBtu': 0.003412, 'MJ': 3.6 },
      'MWh': { 'kWh': 1000, 'GWh': 0.001, 'MMBtu': 3.412, 'MJ': 3600 },
      'MMBtu': { 'kWh': 293.07, 'MWh': 0.29307, 'MJ': 1055.06 },
      
      // Volume conversions
      'gallon': { 'liter': 3.78541, 'm3': 0.00378541 },
      'liter': { 'gallon': 0.264172, 'm3': 0.001 },
      'm3': { 'liter': 1000, 'gallon': 264.172 },
      
      // Mass conversions
      'kg': { 'tonne': 0.001, 'lb': 2.20462 },
      'tonne': { 'kg': 1000, 'lb': 2204.62 },
      'lb': { 'kg': 0.453592, 'tonne': 0.000453592 }
    }

    if (conversions[fromUnit] && conversions[fromUnit][toUnit]) {
      return value * conversions[fromUnit][toUnit]
    }

    throw new Error(`Cannot convert from ${fromUnit} to ${toUnit}`)
  }

  private determineGridType(region: string, gridRegion?: string): string {
    if (gridRegion) return gridRegion

    // Default grid types by region
    const defaultGrids: { [key: string]: string } = {
      'US': 'grid_us_national',
      'GB': 'grid_uk',
      'DE': 'grid_germany',
      'CN': 'grid_china',
      'IN': 'grid_india',
      'FR': 'grid_france',
      'NO': 'grid_norway'
    }

    return defaultGrids[region] || 'grid_us_national'
  }

  private getScope3CategoryMapping(): { [key: number]: { category: string, subcategory: string, unit: string } } {
    return {
      1: { category: 'material', subcategory: 'steel', unit: 'kg' },
      2: { category: 'material', subcategory: 'steel', unit: 'kg' },
      3: { category: 'fuel_upstream', subcategory: 'natural_gas_upstream', unit: 'MMBtu' },
      4: { category: 'transport', subcategory: 'air_domestic_short', unit: 'passenger_km' },
      5: { category: 'waste', subcategory: 'general_waste_landfill', unit: 'kg' },
      6: { category: 'transport', subcategory: 'air_domestic_short', unit: 'passenger_km' },
      7: { category: 'transport', subcategory: 'car_commute_gasoline', unit: 'passenger_km' },
      8: { category: 'material', subcategory: 'steel', unit: 'kg' },
      9: { category: 'transport', subcategory: 'heavy_duty_truck_diesel', unit: 'km' },
      10: { category: 'waste', subcategory: 'general_waste_landfill', unit: 'kg' },
      11: { category: 'material', subcategory: 'steel', unit: 'kg' },
      12: { category: 'waste', subcategory: 'general_waste_landfill', unit: 'kg' },
      13: { category: 'material', subcategory: 'steel', unit: 'kg' },
      14: { category: 'transport', subcategory: 'air_domestic_short', unit: 'passenger_km' },
      15: { category: 'material', subcategory: 'steel', unit: 'kg' }
    }
  }

  private calculateConfidenceLevel(factor: any, activityUnit: string): number {
    let baseConfidence = 80

    // Adjust based on emission factor source
    if (factor.source.includes('EPA') || factor.source.includes('IPCC')) {
      baseConfidence += 10
    }
    if (factor.source.includes('DEFRA')) {
      baseConfidence += 8
    }

    // Adjust based on data precision
    if (activityUnit.includes('meter') || activityUnit.includes('exact')) {
      baseConfidence += 5
    }

    return Math.min(95, baseConfidence)
  }

  private getDataQualityMultiplier(quality: number): number {
    // Data quality multipliers based on GHG Protocol guidance
    const multipliers = {
      1: 1.5,  // Low quality - apply uncertainty multiplier
      2: 1.3,
      3: 1.0,  // Medium quality - no adjustment
      4: 0.9,
      5: 0.8   // High quality - more precise
    }
    return multipliers[quality] || 1.0
  }

  private calculateScope3Confidence(method: string, quality: number): number {
    let baseConfidence = method === 'activity_based' ? 70 : 50

    // Adjust for data quality
    baseConfidence += (quality - 3) * 10

    return Math.max(30, Math.min(90, baseConfidence))
  }

  private calculateOverallDataQuality(results: EmissionResult[]): number {
    const avgConfidence = results.reduce((sum, r) => sum + r.confidenceLevel, 0) / results.length
    return Math.round(avgConfidence)
  }

  private async saveScope1Details(assessmentId: string, results: EmissionResult[]): Promise<void> {
    // Implementation would save to scope1_emissions table
    // This is a placeholder for the detailed implementation
  }

  private async saveScope2Details(assessmentId: string, results: EmissionResult[]): Promise<void> {
    // Implementation would save to scope2_emissions table
    // This is a placeholder for the detailed implementation
  }

  private async saveScope3Details(assessmentId: string, results: EmissionResult[]): Promise<void> {
    // Implementation would save to scope3_emissions table
    // This is a placeholder for the detailed implementation
  }
}

// Export singleton instance
export const carbonCalculator = new CarbonCalculator() 