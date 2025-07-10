-- Emission Factors Seed Data
-- Based on EPA eGRID 2021, DEFRA 2023, and IPCC AR5 standards

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
('fuel', 'coal_anthracite', 1, 2602.06, 'tonne', 'EPA 2023', 'AP-42', 'US'),

-- Mobile Combustion
('transport', 'passenger_car_gasoline', 1, 8.89, 'gallon', 'EPA 2023', 'Mobile Sources', 'US'),
('transport', 'light_truck_gasoline', 1, 8.78, 'gallon', 'EPA 2023', 'Mobile Sources', 'US'),
('transport', 'heavy_duty_truck_diesel', 1, 10.21, 'gallon', 'EPA 2023', 'Mobile Sources', 'US'),

-- Refrigerants (GWP AR5)
('refrigerant', 'hfc_134a', 1, 1430000.0, 'kg', 'IPCC AR5', 'GWP 100-year', 'GLOBAL'),
('refrigerant', 'hfc_410a', 1, 2088000.0, 'kg', 'IPCC AR5', 'GWP 100-year', 'GLOBAL'),
('refrigerant', 'r_22', 1, 1810000.0, 'kg', 'IPCC AR5', 'GWP 100-year', 'GLOBAL'),

-- Scope 2 Emission Factors - Electricity by Region (EPA eGRID 2021)
('electricity', 'grid_us_national', 2, 0.8554, 'kWh', 'EPA eGRID 2021', 'Location-based', 'US'),
('electricity', 'grid_california', 2, 0.4578, 'kWh', 'EPA eGRID 2021', 'Location-based', 'US'),
('electricity', 'grid_texas', 2, 0.8900, 'kWh', 'EPA eGRID 2021', 'Location-based', 'US'),
('electricity', 'grid_new_york', 2, 0.5734, 'kWh', 'EPA eGRID 2021', 'Location-based', 'US'),
('electricity', 'grid_florida', 2, 0.9876, 'kWh', 'EPA eGRID 2021', 'Location-based', 'US'),

-- International Electricity Grids (IEA 2022)
('electricity', 'grid_uk', 2, 0.2556, 'kWh', 'DEFRA 2023', 'Location-based', 'GB'),
('electricity', 'grid_germany', 2, 0.4856, 'kWh', 'UBA Germany 2022', 'Location-based', 'DE'),
('electricity', 'grid_china', 2, 0.6101, 'kWh', 'IEA 2022', 'Location-based', 'CN'),
('electricity', 'grid_india', 2, 0.9156, 'kWh', 'IEA 2022', 'Location-based', 'IN'),

-- Steam, Heating, Cooling
('energy', 'steam_industrial', 2, 66.33, 'MMBtu', 'EPA 2023', 'Location-based', 'US'),
('energy', 'district_heating', 2, 66.33, 'MMBtu', 'EPA 2023', 'Location-based', 'US'),
('energy', 'district_cooling', 2, 117.08, 'MMBtu', 'EPA 2023', 'Location-based', 'US'),

-- Scope 3 Emission Factors - Category 1: Purchased Goods & Services
('material', 'steel', 3, 2.89, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),
('material', 'aluminum', 3, 11.46, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),
('material', 'concrete', 3, 0.13, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),
('material', 'paper', 3, 0.91, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),
('material', 'plastic_pet', 3, 2.15, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),
('material', 'glass', 3, 0.85, 'kg', 'DEFRA 2023', 'Cradle-to-gate', 'GLOBAL'),

-- Scope 3 - Category 3: Fuel and Energy Related Activities
('fuel_upstream', 'natural_gas_upstream', 3, 10.58, 'MMBtu', 'EPA 2023', 'Well-to-tank', 'US'),
('fuel_upstream', 'gasoline_upstream', 3, 2.78, 'gallon', 'EPA 2023', 'Well-to-tank', 'US'),
('fuel_upstream', 'diesel_upstream', 3, 2.84, 'gallon', 'EPA 2023', 'Well-to-tank', 'US'),
('electricity_upstream', 'grid_transmission_us', 3, 0.0657, 'kWh', 'EPA 2023', 'T&D Losses', 'US'),

-- Scope 3 - Category 6: Business Travel
('transport', 'air_domestic_short', 3, 0.24, 'passenger_km', 'DEFRA 2023', 'Average aircraft', 'GLOBAL'),
('transport', 'air_domestic_medium', 3, 0.15, 'passenger_km', 'DEFRA 2023', 'Average aircraft', 'GLOBAL'),
('transport', 'air_international_long', 3, 0.19, 'passenger_km', 'DEFRA 2023', 'Average aircraft', 'GLOBAL'),
('transport', 'rail_passenger', 3, 0.041, 'passenger_km', 'DEFRA 2023', 'National rail', 'GB'),
('transport', 'taxi', 3, 0.21, 'passenger_km', 'DEFRA 2023', 'Average taxi', 'GLOBAL'),
('transport', 'hotel_night', 3, 29.4, 'room_night', 'DEFRA 2023', 'Average hotel', 'GLOBAL'),

-- Scope 3 - Category 7: Employee Commuting
('transport', 'car_commute_gasoline', 3, 0.17, 'passenger_km', 'DEFRA 2023', 'Average car', 'GLOBAL'),
('transport', 'car_commute_diesel', 3, 0.16, 'passenger_km', 'DEFRA 2023', 'Average car', 'GLOBAL'),
('transport', 'bus_commute', 3, 0.10, 'passenger_km', 'DEFRA 2023', 'Local bus', 'GLOBAL'),
('transport', 'train_commute', 3, 0.041, 'passenger_km', 'DEFRA 2023', 'National rail', 'GB'),

-- Scope 3 - Category 5: Waste Generated in Operations
('waste', 'mixed_recycling', 3, 0.021, 'kg', 'DEFRA 2023', 'Waste treatment', 'GB'),
('waste', 'food_waste_composting', 3, 0.57, 'kg', 'DEFRA 2023', 'Composting', 'GB'),
('waste', 'paper_recycling', 3, 0.021, 'kg', 'DEFRA 2023', 'Recycling', 'GB'),
('waste', 'general_waste_landfill', 3, 0.47, 'kg', 'DEFRA 2023', 'Landfill', 'GB'),
('waste', 'general_waste_incineration', 3, 0.021, 'kg', 'DEFRA 2023', 'Incineration', 'GB'),

-- Water and Wastewater (varies by region)
('utilities', 'water_supply', 3, 0.344, 'm3', 'DEFRA 2023', 'Supply and treatment', 'GB'),
('utilities', 'wastewater_treatment', 3, 0.272, 'm3', 'DEFRA 2023', 'Treatment', 'GB');

-- Update emission factors for different regions with regional variations
-- UK specific factors (DEFRA 2023)
INSERT INTO emission_factors (category, subcategory, scope, emission_factor, unit, source, methodology, region) VALUES
('fuel', 'natural_gas_commercial', 1, 2.033, 'kWh', 'DEFRA 2023', 'Net CV basis', 'GB'),
('fuel', 'heating_oil', 1, 2.518, 'liter', 'DEFRA 2023', 'Net CV basis', 'GB'),
('fuel', 'lpg', 1, 1.493, 'liter', 'DEFRA 2023', 'Net CV basis', 'GB'),
('fuel', 'petrol', 1, 2.168, 'liter', 'DEFRA 2023', 'Net CV basis', 'GB'),
('fuel', 'diesel', 1, 2.512, 'liter', 'DEFRA 2023', 'Net CV basis', 'GB');

-- European specific factors
INSERT INTO emission_factors (category, subcategory, scope, emission_factor, unit, source, methodology, region) VALUES
('electricity', 'grid_france', 2, 0.0768, 'kWh', 'IEA 2022', 'Location-based', 'FR'),
('electricity', 'grid_norway', 2, 0.0176, 'kWh', 'IEA 2022', 'Location-based', 'NO'),
('electricity', 'grid_coal_poland', 2, 0.8123, 'kWh', 'IEA 2022', 'Location-based', 'PL'); 