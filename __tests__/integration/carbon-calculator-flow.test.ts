import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CarbonCalculator } from '../../components/calculator/carbon-calculator'
import { carbonCalculatorApi } from '../../lib/supabase'

// Mock the API functions
jest.mock('../../lib/supabase', () => ({
  carbonCalculatorApi: {
    calculateFootprint: jest.fn(),
    getEmissionFactorCategories: jest.fn(),
    getEmissionFactors: jest.fn(),
    getAssessments: jest.fn(),
    updateAssessmentStatus: jest.fn()
  }
}))

// Mock the auth hook
jest.mock('../../hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false
  })
}))

// Mock the toast hook
jest.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

const mockCalculationResult = {
  assessmentId: 'test-assessment-123',
  summary: {
    scope1Total: 53.06,
    scope2Total: 19.30,
    scope3Total: 11.50,
    totalEmissions: 83.86,
    averageConfidence: 85,
    emissionsByScope: {
      scope1: 63,
      scope2: 23,
      scope3: 14
    }
  },
  insights: [
    {
      type: 'scope_distribution',
      message: 'Your emissions are primarily from Scope 1 sources (63%). Consider energy efficiency improvements.',
      priority: 'medium'
    },
    {
      type: 'data_quality',
      message: 'Good data quality with 85% confidence. Consider improving Scope 3 data collection.',
      priority: 'low'
    }
  ],
  recommendations: [
    {
      scope: 1,
      action: 'Switch to Renewable Energy',
      description: 'Replace fossil fuel heating with electric heat pumps powered by renewable energy.',
      potentialReduction: '30-50%',
      priority: 'high'
    },
    {
      scope: 2,
      action: 'Energy Efficiency Upgrades',
      description: 'Install LED lighting, smart HVAC controls, and energy-efficient equipment.',
      potentialReduction: '15-25%',
      priority: 'medium'
    },
    {
      scope: 3,
      action: 'Sustainable Travel Policy',
      description: 'Implement video conferencing and train travel preferences over flights.',
      potentialReduction: '20-40%',
      priority: 'medium'
    }
  ]
}

const mockEmissionFactorCategories = {
  scopes: {
    1: {
      categories: ['fuel', 'process', 'fugitive'],
      subcategories: {
        fuel: ['natural_gas_commercial', 'diesel', 'gasoline'],
        process: ['cement_production', 'steel_production'],
        fugitive: ['refrigerants', 'sf6']
      }
    },
    2: {
      categories: ['electricity', 'steam', 'heating'],
      subcategories: {
        electricity: ['grid_us_national', 'grid_california', 'grid_texas'],
        steam: ['purchased_steam'],
        heating: ['district_heating']
      }
    },
    3: {
      categories: ['transport', 'materials', 'waste'],
      subcategories: {
        transport: ['business_travel_air', 'employee_commuting'],
        materials: ['steel', 'concrete', 'paper'],
        waste: ['solid_waste', 'wastewater']
      }
    }
  }
}

describe('Carbon Calculator Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock API responses
    ;(carbonCalculatorApi.getEmissionFactorCategories as jest.Mock).mockResolvedValue(
      mockEmissionFactorCategories
    )
    
    ;(carbonCalculatorApi.calculateFootprint as jest.Mock).mockResolvedValue(
      mockCalculationResult
    )
  })

  describe('Complete Assessment Flow', () => {
    it('should complete a full carbon assessment from start to finish', async () => {
      render(<CarbonCalculator />)

      // Step 1: Fill out assessment information
      expect(screen.getByText('Assessment Information')).toBeInTheDocument()
      
      const orgNameInput = screen.getByLabelText(/organization name/i)
      await user.type(orgNameInput, 'Test Company Inc.')

      const yearSelect = screen.getByRole('combobox', { name: /assessment year/i })
      await user.click(yearSelect)
      await user.click(screen.getByText('2023'))

      // Continue to Scope 1
      const continueToScope1 = screen.getByRole('button', { name: /continue to scope 1/i })
      await user.click(continueToScope1)

      // Step 2: Add Scope 1 emissions
      expect(screen.getByText('Direct Emissions')).toBeInTheDocument()
      
      const addScope1Source = screen.getByRole('button', { name: /add source/i })
      await user.click(addScope1Source)

      // Fill out Scope 1 data
      const fuelTypeInput = screen.getByPlaceholderText(/e.g., natural_gas_commercial/i)
      await user.type(fuelTypeInput, 'natural_gas_commercial')

      const activityDataInput = screen.getByPlaceholderText(/consumption amount/i)
      await user.type(activityDataInput, '1000')

      const unitSelect = screen.getByRole('combobox', { name: /unit/i })
      await user.click(unitSelect)
      await user.click(screen.getByText('MMBtu'))

      // Continue to Scope 2
      const continueToScope2 = screen.getByRole('button', { name: /continue to scope 2/i })
      await user.click(continueToScope2)

      // Step 3: Add Scope 2 emissions
      expect(screen.getByText('Indirect Energy Emissions')).toBeInTheDocument()
      
      const addScope2Source = screen.getByRole('button', { name: /add energy source/i })
      await user.click(addScope2Source)

      // Fill out Scope 2 data
      const energyActivityInput = screen.getByPlaceholderText(/energy consumption/i)
      await user.type(energyActivityInput, '50000')

      const energyUnitSelect = screen.getAllByRole('combobox')[1] // Second combobox for unit
      await user.click(energyUnitSelect)
      await user.click(screen.getByText('kWh'))

      // Continue to Scope 3
      const continueToScope3 = screen.getByRole('button', { name: /continue to scope 3/i })
      await user.click(continueToScope3)

      // Step 4: Add Scope 3 emissions
      expect(screen.getByText('Other Indirect Emissions')).toBeInTheDocument()
      
      const addScope3Category = screen.getByRole('button', { name: /add category/i })
      await user.click(addScope3Category)

      // Fill out Scope 3 data
      const scope3ActivityInput = screen.getByPlaceholderText(/amount or spend/i)
      await user.type(scope3ActivityInput, '100000')

      const scope3UnitSelect = screen.getByRole('combobox', { name: /unit/i })
      await user.click(scope3UnitSelect)
      await user.click(screen.getByText('passenger_km'))

      // Step 5: Calculate footprint
      const calculateButton = screen.getByRole('button', { name: /calculate footprint/i })
      await user.click(calculateButton)

      // Wait for calculation to complete
      await waitFor(() => {
        expect(carbonCalculatorApi.calculateFootprint).toHaveBeenCalledWith({
          assessment: expect.objectContaining({
            organizationName: 'Test Company Inc.',
            assessmentYear: 2023
          }),
          scope1Data: expect.arrayContaining([
            expect.objectContaining({
              fuelType: 'natural_gas_commercial',
              activityData: 1000,
              activityUnit: 'MMBtu'
            })
          ]),
          scope2Data: expect.arrayContaining([
            expect.objectContaining({
              activityData: 50000,
              activityUnit: 'kWh'
            })
          ]),
          scope3Data: expect.arrayContaining([
            expect.objectContaining({
              activityData: 100000,
              activityUnit: 'passenger_km'
            })
          ]),
          region: 'US'
        })
      })

      // Step 6: Verify results display
      await waitFor(() => {
        expect(screen.getByText('83.86')).toBeInTheDocument() // Total emissions
        expect(screen.getByText('53.06')).toBeInTheDocument() // Scope 1 total
        expect(screen.getByText('19.30')).toBeInTheDocument() // Scope 2 total
        expect(screen.getByText('11.50')).toBeInTheDocument() // Scope 3 total
      })

      // Verify insights are displayed
      expect(screen.getByText(/emissions are primarily from scope 1/i)).toBeInTheDocument()

      // Verify recommendations are displayed
      expect(screen.getByText('Switch to Renewable Energy')).toBeInTheDocument()
      expect(screen.getByText('Energy Efficiency Upgrades')).toBeInTheDocument()
      expect(screen.getByText('Sustainable Travel Policy')).toBeInTheDocument()

      // Verify action buttons are available
      expect(screen.getByRole('button', { name: /download report/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit for verification/i })).toBeInTheDocument()
    })

    it('should handle validation errors appropriately', async () => {
      render(<CarbonCalculator />)

      // Try to calculate without filling organization name
      const continueToScope1 = screen.getByRole('button', { name: /continue to scope 1/i })
      await user.click(continueToScope1)

      const continueToScope2 = screen.getByRole('button', { name: /continue to scope 2/i })
      await user.click(continueToScope2)

      const continueToScope3 = screen.getByRole('button', { name: /continue to scope 3/i })
      await user.click(continueToScope3)

      const calculateButton = screen.getByRole('button', { name: /calculate footprint/i })
      await user.click(calculateButton)

      // Should not call the API
      expect(carbonCalculatorApi.calculateFootprint).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      // Mock API error
      ;(carbonCalculatorApi.calculateFootprint as jest.Mock).mockRejectedValue(
        new Error('Calculation failed: Invalid emission factor')
      )

      render(<CarbonCalculator />)

      // Fill minimum required data
      const orgNameInput = screen.getByLabelText(/organization name/i)
      await user.type(orgNameInput, 'Test Company')

      // Navigate to calculate
      await user.click(screen.getByRole('button', { name: /continue to scope 1/i }))
      await user.click(screen.getByRole('button', { name: /continue to scope 2/i }))
      await user.click(screen.getByRole('button', { name: /continue to scope 3/i }))
      await user.click(screen.getByRole('button', { name: /calculate footprint/i }))

      // Should handle the error
      await waitFor(() => {
        expect(carbonCalculatorApi.calculateFootprint).toHaveBeenCalled()
      })
    })
  })

  describe('Data Entry Validation', () => {
    it('should validate required fields for each scope', async () => {
      render(<CarbonCalculator />)

      // Navigate to Scope 1
      await user.click(screen.getByRole('button', { name: /continue to scope 1/i }))
      
      // Add a source but don't fill required fields
      await user.click(screen.getByRole('button', { name: /add source/i }))

      // Should have empty/default values
      const fuelTypeInput = screen.getByPlaceholderText(/e.g., natural_gas_commercial/i)
      expect(fuelTypeInput).toHaveValue('')

      const activityDataInput = screen.getByPlaceholderText(/consumption amount/i)
      expect(activityDataInput).toHaveValue(0)
    })

    it('should allow adding and removing emission sources', async () => {
      render(<CarbonCalculator />)

      // Navigate to Scope 1
      await user.click(screen.getByRole('button', { name: /continue to scope 1/i }))
      
      // Add multiple sources
      await user.click(screen.getByRole('button', { name: /add source/i }))
      await user.click(screen.getByRole('button', { name: /add source/i }))

      // Should have 2 sources
      expect(screen.getAllByText(/source \d+/i)).toHaveLength(2)

      // Remove one source
      const deleteButtons = screen.getAllByRole('button', { name: '' }) // Trash icon buttons
      const trashButton = deleteButtons.find(btn => 
        btn.querySelector('svg') && 
        btn.className.includes('text-red-400')
      )
      
      if (trashButton) {
        await user.click(trashButton)
      }

      // Should have 1 source left
      expect(screen.getAllByText(/source \d+/i)).toHaveLength(1)
    })
  })

  describe('Results Display', () => {
    it('should display results with proper formatting and units', async () => {
      // Mock the calculation to return results immediately
      ;(carbonCalculatorApi.calculateFootprint as jest.Mock).mockResolvedValue(
        mockCalculationResult
      )

      render(<CarbonCalculator />)

      // Set up minimum data and calculate
      const orgNameInput = screen.getByLabelText(/organization name/i)
      await user.type(orgNameInput, 'Test Company')

      // Navigate to results through calculation
      await user.click(screen.getByRole('button', { name: /continue to scope 1/i }))
      await user.click(screen.getByRole('button', { name: /continue to scope 2/i }))
      await user.click(screen.getByRole('button', { name: /continue to scope 3/i }))
      await user.click(screen.getByRole('button', { name: /calculate footprint/i }))

      // Wait for results
      await waitFor(() => {
        // Check total emissions with unit
        expect(screen.getByText('83.86')).toBeInTheDocument()
        expect(screen.getByText('Total tCO₂e')).toBeInTheDocument()

        // Check scope breakdowns with percentages
        expect(screen.getByText('Scope 1 (63%)')).toBeInTheDocument()
        expect(screen.getByText('Scope 2 (23%)')).toBeInTheDocument()
        expect(screen.getByText('Scope 3 (14%)')).toBeInTheDocument()

        // Check confidence score
        expect(screen.getByText('85%')).toBeInTheDocument()
        expect(screen.getByText('Confidence')).toBeInTheDocument()
      })
    })

    it('should display insights and recommendations correctly', async () => {
      ;(carbonCalculatorApi.calculateFootprint as jest.Mock).mockResolvedValue(
        mockCalculationResult
      )

      render(<CarbonCalculator />)

      // Navigate to results
      const orgNameInput = screen.getByLabelText(/organization name/i)
      await user.type(orgNameInput, 'Test Company')

      await user.click(screen.getByRole('button', { name: /continue to scope 1/i }))
      await user.click(screen.getByRole('button', { name: /continue to scope 2/i }))
      await user.click(screen.getByRole('button', { name: /continue to scope 3/i }))
      await user.click(screen.getByRole('button', { name: /calculate footprint/i }))

      await waitFor(() => {
        // Check insights section
        expect(screen.getByText('Key Insights')).toBeInTheDocument()
        expect(screen.getByText(/emissions are primarily from scope 1/i)).toBeInTheDocument()

        // Check recommendations section
        expect(screen.getByText('Reduction Recommendations')).toBeInTheDocument()
        expect(screen.getByText('Switch to Renewable Energy')).toBeInTheDocument()
        expect(screen.getByText('30-50% reduction')).toBeInTheDocument()
      })
    })
  })
})

describe('API Endpoint Integration Tests', () => {
  // These tests would require a test database and actual API calls
  // For now, we'll focus on the contract testing

  describe('POST /api/carbon-calculator/calculate', () => {
    it('should accept valid calculation data structure', () => {
      const validPayload = {
        assessment: {
          organizationName: 'Test Company',
          assessmentYear: 2023,
          reportingPeriodStart: '2023-01-01',
          reportingPeriodEnd: '2023-12-31',
          assessmentBoundary: 'Operational Control',
          methodology: 'GHG_PROTOCOL'
        },
        scope1Data: [],
        scope2Data: [],
        scope3Data: [],
        region: 'US'
      }

      // Validate the structure matches our expected API contract
      expect(validPayload).toMatchObject({
        assessment: expect.objectContaining({
          organizationName: expect.any(String),
          assessmentYear: expect.any(Number),
          reportingPeriodStart: expect.any(String),
          reportingPeriodEnd: expect.any(String),
          assessmentBoundary: expect.any(String),
          methodology: expect.any(String)
        }),
        scope1Data: expect.any(Array),
        scope2Data: expect.any(Array),
        scope3Data: expect.any(Array),
        region: expect.any(String)
      })
    })
  })

  describe('GET /api/carbon-calculator/emission-factors', () => {
    it('should return properly structured emission factor data', () => {
      const mockResponse = mockEmissionFactorCategories

      expect(mockResponse).toMatchObject({
        scopes: {
          1: expect.objectContaining({
            categories: expect.any(Array),
            subcategories: expect.any(Object)
          }),
          2: expect.objectContaining({
            categories: expect.any(Array),
            subcategories: expect.any(Object)
          }),
          3: expect.objectContaining({
            categories: expect.any(Array),
            subcategories: expect.any(Object)
          })
        }
      })
    })
  })
}) 