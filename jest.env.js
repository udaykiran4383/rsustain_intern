// Environment variables for testing

// Supabase configuration
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-role-key'

// Database configuration for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/rsustain_test'

// Testing flags
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_APP_ENV = 'test'

// API configuration
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'

// Feature flags for testing
process.env.ENABLE_CARBON_CALCULATOR = 'true'
process.env.ENABLE_BLOCKCHAIN_VERIFICATION = 'true'
process.env.ENABLE_AI_INSIGHTS = 'true' 