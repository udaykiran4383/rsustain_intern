-- Carbon Footprint Calculator Database Setup
-- Combined schema and seed data

-- Carbon Footprint Calculator Database Schema
-- Based on GHG Protocol and IPCC emission factors

-- Emission factors table with scientific data
CREATE TABLE IF NOT EXISTS emission_factors (
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
CREATE TABLE IF NOT EXISTS carbon_assessments (
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
CREATE TABLE IF NOT EXISTS scope1_emissions (
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
CREATE TABLE IF NOT EXISTS scope2_emissions (
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
CREATE TABLE IF NOT EXISTS scope3_emissions (
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
CREATE TABLE IF NOT EXISTS carbon_verifications (
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
CREATE INDEX IF NOT EXISTS idx_emission_factors_category ON emission_factors(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_emission_factors_scope ON emission_factors(scope);
CREATE INDEX IF NOT EXISTS idx_carbon_assessments_user ON carbon_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_assessments_year ON carbon_assessments(assessment_year);
CREATE INDEX IF NOT EXISTS idx_scope1_assessment ON scope1_emissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_scope2_assessment ON scope2_emissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_scope3_assessment ON scope3_emissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_scope3_category ON scope3_emissions(category_number);

-- Seed emission factors data
-- Based on EPA eGRID 2021, DEFRA 2023, and IPCC AR5 standards

-- Clear existing data if any
DELETE FROM emission_factors;

-- Scope 1 Emission Factors - Fuels (EPA 2023)
INSERT INTO emission_factors (category, subcategory, scope, emission_factor, unit, source, methodology, region) VALUES
-- Natural Gas
('fuel', 'natural_gas_commercial', 1, 53.02, 'MMBtu', 'EPA 2023', 'AP-42', 'US'),
('fuel', 'natural_gas_industrial', 1, 53.06, 'MMBtu', 'EPA 2023', 'AP-42', 'US'),
-- Heating Oil
('fuel', 'heating_oil_no2', 1, 73.25, 'gallon', 'EPA 2023', 'AP-42', 'US'),
-- Gasoline
('fuel', 'gasoline_motor', 1, 19.59, 'gallon', 'EPA 2023', 'AP-42', 'US'),
-- Diesel
('fuel', 'diesel_fuel', 1, 22.51, 'gallon', 'EPA 2023', 'AP-42', 'US'),
-- Propane
('fuel', 'propane', 1, 12.68, 'gallon', 'EPA 2023', 'AP-42', 'US'),
-- Coal
('fuel', 'coal_bituminous', 1, 2325.74, 'tonne', 'EPA 2023', 'AP-42', 'US'),

-- Mobile Combustion
('transport', 'passenger_car_gasoline', 1, 8.89, 'gallon', 'EPA 2023', 'Mobile Sources', 'US'),
('transport', 'light_truck_gasoline', 1, 8.78, 'gallon', 'EPA 2023', 'Mobile Sources', 'US'),
('transport', 'heavy_duty_truck_diesel', 1, 10.21, 'gallon', 'EPA 2023', 'Mobile Sources', 'US'),

-- Refrigerants (GWP AR5)
('refrigerant', 'hfc_134a', 1, 1430.0, 'kg', 'IPCC AR5', 'GWP 100-year', 'GLOBAL'),
('refrigerant', 'hfc_410a', 1, 2088.0, 'kg', 'IPCC AR5', 'GWP 100-year', 'GLOBAL'),

-- Scope 2 Emission Factors - Electricity by Region (EPA eGRID 2021)
('electricity', 'grid_us_national', 2, 0.8554, 'kWh', 'EPA eGRID 2021', 'Location-based', 'US'),
('electricity', 'grid_california', 2, 0.4578, 'kWh', 'EPA eGRID 2021', 'Location-based', 'US'),
('electricity', 'grid_texas', 2, 0.8900, 'kWh', 'EPA eGRID 2021', 'Location-based', 'US'),
('electricity', 'grid_new_york', 2, 0.5734, 'kWh', 'EPA eGRID 2021', 'Location-based', 'US'),

-- International Electricity Grids
('electricity', 'grid_uk', 2, 0.2556, 'kWh', 'DEFRA 2023', 'Location-based', 'GB'),
('electricity', 'grid_germany', 2, 0.4856, 'kWh', 'UBA Germany 2022', 'Location-based', 'DE'),

-- Steam, Heating, Cooling
('energy', 'steam_industrial', 2, 66.33, 'MMBtu', 'EPA 2023', 'Location-based', 'US'),
('energy', 'district_heating', 2, 66.33, 'MMBtu', 'EPA 2023', 'Location-based', 'US'),

-- Scope 3 Emission Factors
('material', 'steel', 3, 2.89, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),
('material', 'aluminum', 3, 11.46, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),
('material', 'concrete', 3, 0.13, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),
('material', 'paper', 3, 0.91, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),

-- Scope 3 - Business Travel
('transport', 'air_domestic_short', 3, 0.24, 'passenger_km', 'DEFRA 2023', 'Average aircraft', 'GLOBAL'),
('transport', 'air_domestic_medium', 3, 0.15, 'passenger_km', 'DEFRA 2023', 'Average aircraft', 'GLOBAL'),
('transport', 'air_international_long', 3, 0.19, 'passenger_km', 'DEFRA 2023', 'Average aircraft', 'GLOBAL'),
('transport', 'rail_passenger', 3, 0.041, 'passenger_km', 'DEFRA 2023', 'National rail', 'GB'),

-- Scope 3 - Employee Commuting
('transport', 'car_commute_gasoline', 3, 0.17, 'passenger_km', 'DEFRA 2023', 'Average car', 'GLOBAL'),
('transport', 'car_commute_diesel', 3, 0.16, 'passenger_km', 'DEFRA 2023', 'Average car', 'GLOBAL'),
('transport', 'bus_commute', 3, 0.10, 'passenger_km', 'DEFRA 2023', 'Local bus', 'GLOBAL'),

-- Scope 3 - Waste
('waste', 'mixed_recycling', 3, 0.021, 'kg', 'DEFRA 2023', 'Waste treatment', 'GB'),
('waste', 'food_waste_composting', 3, 0.57, 'kg', 'DEFRA 2023', 'Composting', 'GB'),
('waste', 'general_waste_landfill', 3, 0.47, 'kg', 'DEFRA 2023', 'Landfill', 'GB'),

-- Water and Wastewater
('utilities', 'water_supply', 3, 0.344, 'm3', 'DEFRA 2023', 'Supply and treatment', 'GB'),
('utilities', 'wastewater_treatment', 3, 0.272, 'm3', 'DEFRA 2023', 'Treatment', 'GB');

-- UK specific factors (DEFRA 2023)
INSERT INTO emission_factors (category, subcategory, scope, emission_factor, unit, source, methodology, region) VALUES
('fuel', 'natural_gas_commercial', 1, 2.033, 'kWh', 'DEFRA 2023', 'Net CV basis', 'GB'),
('fuel', 'heating_oil', 1, 2.518, 'liter', 'DEFRA 2023', 'Net CV basis', 'GB'),
('fuel', 'petrol', 1, 2.168, 'liter', 'DEFRA 2023', 'Net CV basis', 'GB'),
('fuel', 'diesel', 1, 2.512, 'liter', 'DEFRA 2023', 'Net CV basis', 'GB'); 