import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Get emission factors with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const scope = searchParams.get('scope')
    const region = searchParams.get('region') || 'GLOBAL'
    const search = searchParams.get('search')
    
    // Build query
    let query = supabase
      .from('emission_factors')
      .select('*')
      .order('category')
      .order('subcategory')

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    
    if (scope) {
      query = query.eq('scope', parseInt(scope))
    }
    
    if (region !== 'ALL') {
      query = query.in('region', [region, 'GLOBAL'])
    }
    
    if (search) {
      query = query.or(`subcategory.ilike.%${search}%,source.ilike.%${search}%`)
    }

    const { data: factors, error } = await query.limit(100)

    if (error) {
      console.error('Error fetching emission factors:', error)
      
      // If table doesn't exist, provide fallback mock data
      if (error.message.includes('does not exist')) {
        const mockFactors = getMockEmissionFactors()
        
        // Apply same filters to mock data
        let filteredMock = mockFactors
        
        if (category) {
          filteredMock = filteredMock.filter(f => f.category === category)
        }
        
        if (scope) {
          filteredMock = filteredMock.filter(f => f.scope === parseInt(scope))
        }
        
        if (region !== 'ALL') {
          filteredMock = filteredMock.filter(f => f.region === region || f.region === 'GLOBAL')
        }
        
        if (search) {
          filteredMock = filteredMock.filter(f => 
            f.subcategory.toLowerCase().includes(search.toLowerCase()) ||
            f.source.toLowerCase().includes(search.toLowerCase())
          )
        }

        // Group mock data the same way
        const grouped = filteredMock.reduce((acc: any, factor: any) => {
          if (!acc[factor.scope]) acc[factor.scope] = {}
          if (!acc[factor.scope][factor.category]) acc[factor.scope][factor.category] = []
          acc[factor.scope][factor.category].push(factor)
          return acc
        }, {})

        return NextResponse.json({
          factors: filteredMock,
          grouped: grouped,
          total: filteredMock.length,
          note: 'Using mock data - emission_factors table not found. Please run setup-carbon-calculator.sql'
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch emission factors' }, 
        { status: 500 }
      )
    }

    // Group by category and scope for easier frontend consumption
    const grouped = factors?.reduce((acc: any, factor: any) => {
      if (!acc[factor.scope]) acc[factor.scope] = {}
      if (!acc[factor.scope][factor.category]) acc[factor.scope][factor.category] = []
      acc[factor.scope][factor.category].push(factor)
      return acc
    }, {})

    return NextResponse.json({
      factors: factors || [],
      grouped: grouped || {},
      total: factors?.length || 0
    })

  } catch (error: any) {
    console.error('Emission factors API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Get categories and subcategories for dropdowns
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { action } = body

    if (action === 'get_categories') {
      // Get unique categories and subcategories by scope
      const { data, error } = await supabase
        .from('emission_factors')
        .select('scope, category, subcategory, unit')
        .order('scope')
        .order('category')
        .order('subcategory')

      let factors = data

      if (error) {
        // If table doesn't exist, provide fallback mock categories
        if (error.message.includes('does not exist')) {
          const mockFactors = getMockEmissionFactors()
          factors = mockFactors
        } else {
          return NextResponse.json(
            { error: 'Failed to fetch categories' }, 
            { status: 500 }
          )
        }
      }

      // Organize by scope
      const scopeData: any = {
        1: { name: 'Scope 1 - Direct Emissions', categories: {} },
        2: { name: 'Scope 2 - Indirect Energy', categories: {} },
        3: { name: 'Scope 3 - Other Indirect', categories: {} }
      }

      factors?.forEach((factor: any) => {
        if (!scopeData[factor.scope].categories[factor.category]) {
          scopeData[factor.scope].categories[factor.category] = {
            name: formatCategoryName(factor.category),
            subcategories: []
          }
        }

        const subcategory = {
          value: factor.subcategory,
          label: formatSubcategoryName(factor.subcategory),
          unit: factor.unit
        }

        // Avoid duplicates
        const exists = scopeData[factor.scope].categories[factor.category].subcategories
          .some((s: any) => s.value === subcategory.value)
        
        if (!exists) {
          scopeData[factor.scope].categories[factor.category].subcategories.push(subcategory)
        }
      })

      return NextResponse.json({ scopes: scopeData })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Helper functions to format names for display
function formatCategoryName(category: string): string {
  const categoryNames: { [key: string]: string } = {
    'fuel': 'Fuels & Combustion',
    'transport': 'Transportation',
    'refrigerant': 'Refrigerants & Gases',
    'electricity': 'Electricity',
    'energy': 'Other Energy',
    'material': 'Materials & Products',
    'fuel_upstream': 'Upstream Fuel Activities',
    'electricity_upstream': 'Upstream Electricity',
    'waste': 'Waste Management',
    'utilities': 'Water & Utilities'
  }
  
  return categoryNames[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatSubcategoryName(subcategory: string): string {
  // Convert snake_case to readable format
  return subcategory
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/No2/g, 'No. 2')
    .replace(/Hfc/g, 'HFC')
    .replace(/Lpg/g, 'LPG')
    .replace(/Us/g, 'US')
    .replace(/Uk/g, 'UK')
}

// Mock emission factors for when table doesn't exist
function getMockEmissionFactors() {
  return [
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
      id: 'mock-3',
      category: 'fuel',
      subcategory: 'diesel_fuel',
      scope: 1,
      emission_factor: 22.51,
      unit: 'gallon',
      source: 'EPA 2023',
      methodology: 'AP-42',
      gwp_ar5: true,
      region: 'US',
      year: 2023
    },
    {
      id: 'mock-4',
      category: 'fuel',
      subcategory: 'propane',
      scope: 1,
      emission_factor: 12.68,
      unit: 'gallon',
      source: 'EPA 2023',
      methodology: 'AP-42',
      gwp_ar5: true,
      region: 'US',
      year: 2023
    },
    {
      id: 'mock-5',
      category: 'transport',
      subcategory: 'passenger_car_gasoline',
      scope: 1,
      emission_factor: 8.89,
      unit: 'gallon',
      source: 'EPA 2023',
      methodology: 'Mobile Sources',
      gwp_ar5: true,
      region: 'US',
      year: 2023
    },
    
    // Scope 2 - Indirect Energy Emissions
    {
      id: 'mock-6',
      category: 'electricity',
      subcategory: 'grid_us_national',
      scope: 2,
      emission_factor: 0.8554,
      unit: 'kWh',
      source: 'EPA eGRID 2021',
      methodology: 'Location-based',
      gwp_ar5: true,
      region: 'US',
      year: 2023
    },
    {
      id: 'mock-7',
      category: 'electricity',
      subcategory: 'grid_california',
      scope: 2,
      emission_factor: 0.4578,
      unit: 'kWh',
      source: 'EPA eGRID 2021',
      methodology: 'Location-based',
      gwp_ar5: true,
      region: 'US',
      year: 2023
    },
    {
      id: 'mock-8',
      category: 'electricity',
      subcategory: 'grid_texas',
      scope: 2,
      emission_factor: 0.8900,
      unit: 'kWh',
      source: 'EPA eGRID 2021',
      methodology: 'Location-based',
      gwp_ar5: true,
      region: 'US',
      year: 2023
    },
    {
      id: 'mock-9',
      category: 'electricity',
      subcategory: 'grid_uk',
      scope: 2,
      emission_factor: 0.2556,
      unit: 'kWh',
      source: 'DEFRA 2023',
      methodology: 'Location-based',
      gwp_ar5: true,
      region: 'GB',
      year: 2023
    },
    
    // Scope 3 - Other Indirect Emissions
    {
      id: 'mock-10',
      category: 'transport',
      subcategory: 'air_domestic_short',
      scope: 3,
      emission_factor: 0.24,
      unit: 'passenger_km',
      source: 'DEFRA 2023',
      methodology: 'Average aircraft',
      gwp_ar5: true,
      region: 'GLOBAL',
      year: 2023
    },
    {
      id: 'mock-11',
      category: 'transport',
      subcategory: 'air_international_long',
      scope: 3,
      emission_factor: 0.19,
      unit: 'passenger_km',
      source: 'DEFRA 2023',
      methodology: 'Average aircraft',
      gwp_ar5: true,
      region: 'GLOBAL',
      year: 2023
    },
    {
      id: 'mock-12',
      category: 'material',
      subcategory: 'steel',
      scope: 3,
      emission_factor: 2.89,
      unit: 'kg',
      source: 'DEFRA 2023',
      methodology: 'Cradle-to-gate',
      gwp_ar5: true,
      region: 'GLOBAL',
      year: 2023
    },
    {
      id: 'mock-13',
      category: 'material',
      subcategory: 'aluminum',
      scope: 3,
      emission_factor: 11.46,
      unit: 'kg',
      source: 'DEFRA 2023',
      methodology: 'Cradle-to-gate',
      gwp_ar5: true,
      region: 'GLOBAL',
      year: 2023
    },
    {
      id: 'mock-14',
      category: 'material',
      subcategory: 'concrete',
      scope: 3,
      emission_factor: 0.13,
      unit: 'kg',
      source: 'DEFRA 2023',
      methodology: 'Cradle-to-gate',
      gwp_ar5: true,
      region: 'GLOBAL',
      year: 2023
    },
    {
      id: 'mock-15',
      category: 'waste',
      subcategory: 'general_waste_landfill',
      scope: 3,
      emission_factor: 0.47,
      unit: 'kg',
      source: 'DEFRA 2023',
      methodology: 'Landfill',
      gwp_ar5: true,
      region: 'GB',
      year: 2023
    }
  ]
} 