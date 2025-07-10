-- Carbon Footprint Calculator Database Schema
-- Based on GHG Protocol and IPCC emission factors

-- Emission factors table with scientific data
CREATE TABLE emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL, -- 'fuel', 'electricity', 'transport', 'material', 'waste'
    subcategory VARCHAR(100) NOT NULL, -- specific fuel/material type
    scope INTEGER NOT NULL CHECK (scope IN (1, 2, 3)),
    emission_factor DECIMAL(15, 8) NOT NULL, -- kg CO2e per unit
    unit VARCHAR(20) NOT NULL, -- 'kWh', 'liter', 'kg', 'm3', 'tonne'
    source VARCHAR(200) NOT NULL, -- EPA, DEFRA, IPCC, etc.
    methodology VARCHAR(200),
    gwp_ar5 BOOLEAN DEFAULT true, -- using AR5 Global Warming Potentials
    region VARCHAR(10) DEFAULT 'GLOBAL', -- ISO country code or GLOBAL
    year INTEGER DEFAULT 2023,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment submissions table
CREATE TABLE carbon_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_name VARCHAR(200),
    assessment_year INTEGER NOT NULL,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    assessment_boundary TEXT, -- operational/organizational boundaries
    methodology VARCHAR(100) DEFAULT 'GHG_PROTOCOL', -- GHG Protocol, ISO 14064, etc.
    verification_status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, verified, on_chain
    blockchain_hash VARCHAR(66), -- for on-chain verification
    scope1_total DECIMAL(15, 4) DEFAULT 0, -- tCO2e
    scope2_total DECIMAL(15, 4) DEFAULT 0, -- tCO2e  
    scope3_total DECIMAL(15, 4) DEFAULT 0, -- tCO2e
    total_emissions DECIMAL(15, 4) DEFAULT 0, -- tCO2e
    confidence_level DECIMAL(5, 2), -- 0-100%
    data_quality_score DECIMAL(5, 2), -- 0-100%
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 1 - Direct emissions from owned/controlled sources
CREATE TABLE scope1_emissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES carbon_assessments(id) ON DELETE CASCADE,
    source_category VARCHAR(50) NOT NULL, -- 'stationary_combustion', 'mobile_combustion', 'process', 'fugitive'
    fuel_type VARCHAR(100), -- natural_gas, diesel, gasoline, coal, etc.
    activity_data DECIMAL(15, 4) NOT NULL, -- consumption amount
    activity_unit VARCHAR(20) NOT NULL, -- kWh, liters, m3, kg
    emission_factor DECIMAL(15, 8) NOT NULL, -- kg CO2e per unit
    emission_factor_source VARCHAR(200),
    co2_emissions DECIMAL(15, 4) NOT NULL, -- tCO2
    ch4_emissions DECIMAL(15, 4) DEFAULT 0, -- tCO2e
    n2o_emissions DECIMAL(15, 4) DEFAULT 0, -- tCO2e
    other_ghg_emissions DECIMAL(15, 4) DEFAULT 0, -- tCO2e
    total_emissions DECIMAL(15, 4) NOT NULL, -- tCO2e
    facility_name VARCHAR(200),
    location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 2 - Indirect emissions from purchased energy
CREATE TABLE scope2_emissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES carbon_assessments(id) ON DELETE CASCADE,
    energy_type VARCHAR(50) NOT NULL, -- 'electricity', 'steam', 'heating', 'cooling'
    calculation_method VARCHAR(20) NOT NULL, -- 'location_based', 'market_based'
    activity_data DECIMAL(15, 4) NOT NULL, -- kWh, MJ, etc.
    activity_unit VARCHAR(20) NOT NULL,
    grid_emission_factor DECIMAL(15, 8), -- for location-based
    supplier_emission_factor DECIMAL(15, 8), -- for market-based
    renewable_energy_certificates DECIMAL(15, 4) DEFAULT 0, -- MWh
    total_emissions DECIMAL(15, 4) NOT NULL, -- tCO2e
    facility_name VARCHAR(200),
    utility_provider VARCHAR(200),
    grid_region VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scope 3 - Other indirect emissions
CREATE TABLE scope3_emissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES carbon_assessments(id) ON DELETE CASCADE,
    category_number INTEGER NOT NULL CHECK (category_number BETWEEN 1 AND 15),
    category_name VARCHAR(100) NOT NULL, -- 'purchased_goods', 'business_travel', etc.
    calculation_method VARCHAR(50) NOT NULL, -- 'spend_based', 'activity_based', 'hybrid'
    activity_data DECIMAL(15, 4) NOT NULL,
    activity_unit VARCHAR(50) NOT NULL,
    emission_factor DECIMAL(15, 8) NOT NULL,
    total_emissions DECIMAL(15, 4) NOT NULL, -- tCO2e
    data_quality INTEGER CHECK (data_quality BETWEEN 1 AND 5), -- 1=low, 5=high
    estimation_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification and rewards table
CREATE TABLE carbon_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES carbon_assessments(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES auth.users(id),
    verification_standard VARCHAR(100), -- ISO 14064-3, etc.
    assurance_level VARCHAR(20), -- limited, reasonable
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    blockchain_transaction_hash VARCHAR(66),
    nft_token_id VARCHAR(100),
    carbon_credits_earned DECIMAL(15, 4) DEFAULT 0,
    reward_points INTEGER DEFAULT 0,
    verification_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    verification_report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_emission_factors_category ON emission_factors(category, subcategory);
CREATE INDEX idx_emission_factors_scope ON emission_factors(scope);
CREATE INDEX idx_carbon_assessments_user ON carbon_assessments(user_id);
CREATE INDEX idx_carbon_assessments_year ON carbon_assessments(assessment_year);
CREATE INDEX idx_scope1_assessment ON scope1_emissions(assessment_id);
CREATE INDEX idx_scope2_assessment ON scope2_emissions(assessment_id);
CREATE INDEX idx_scope3_assessment ON scope3_emissions(assessment_id);
CREATE INDEX idx_scope3_category ON scope3_emissions(category_number);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_carbon_assessments_updated_at 
    BEFORE UPDATE ON carbon_assessments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emission_factors_updated_at 
    BEFORE UPDATE ON emission_factors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate total emissions function
CREATE OR REPLACE FUNCTION calculate_assessment_totals(assessment_uuid UUID)
RETURNS void AS $$
DECLARE
    scope1_sum DECIMAL(15, 4);
    scope2_sum DECIMAL(15, 4);
    scope3_sum DECIMAL(15, 4);
    total_sum DECIMAL(15, 4);
BEGIN
    -- Calculate Scope 1 total
    SELECT COALESCE(SUM(total_emissions), 0) INTO scope1_sum
    FROM scope1_emissions 
    WHERE assessment_id = assessment_uuid;
    
    -- Calculate Scope 2 total
    SELECT COALESCE(SUM(total_emissions), 0) INTO scope2_sum
    FROM scope2_emissions 
    WHERE assessment_id = assessment_uuid;
    
    -- Calculate Scope 3 total
    SELECT COALESCE(SUM(total_emissions), 0) INTO scope3_sum
    FROM scope3_emissions 
    WHERE assessment_id = assessment_uuid;
    
    total_sum := scope1_sum + scope2_sum + scope3_sum;
    
    -- Update assessment totals
    UPDATE carbon_assessments 
    SET 
        scope1_total = scope1_sum,
        scope2_total = scope2_sum,
        scope3_total = scope3_sum,
        total_emissions = total_sum,
        updated_at = NOW()
    WHERE id = assessment_uuid;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-calculate totals
CREATE OR REPLACE FUNCTION trigger_calculate_totals()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_assessment_totals(COALESCE(NEW.assessment_id, OLD.assessment_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scope1_calculate_totals
    AFTER INSERT OR UPDATE OR DELETE ON scope1_emissions
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_totals();

CREATE TRIGGER scope2_calculate_totals
    AFTER INSERT OR UPDATE OR DELETE ON scope2_emissions
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_totals();

CREATE TRIGGER scope3_calculate_totals
    AFTER INSERT OR UPDATE OR DELETE ON scope3_emissions
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_totals(); 