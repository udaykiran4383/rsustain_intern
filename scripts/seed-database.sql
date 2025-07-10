-- Seed data for Rsustain Carbon Exchange
-- Run this after the main database setup to populate with sample data

-- Insert sample users (these will be created when users sign up)
-- The auth.users table is managed by Supabase Auth

-- Insert sample projects
INSERT INTO public.projects (
    name, 
    description, 
    location, 
    project_type, 
    certification, 
    total_credits, 
    available_credits, 
    price_per_credit, 
    risk_score, 
    sdg_goals, 
    vintage_year, 
    status
) VALUES 
(
    'Amazon Rainforest Conservation',
    'Large-scale forest conservation project protecting 50,000 hectares of Amazon rainforest in Brazil. This project prevents deforestation and supports local indigenous communities.',
    'Acre, Brazil',
    'reforestation',
    'VERRA',
    50000,
    35000,
    25.50,
    2.3,
    ARRAY['Climate Action', 'Life on Land', 'Sustainable Communities'],
    2024,
    'verified'
),
(
    'Solar Farm Initiative India',
    'Utility-scale solar photovoltaic project generating clean energy for 100,000 households in rural India. Reduces dependency on coal-fired power plants.',
    'Rajasthan, India',
    'renewable_energy',
    'GOLD_STANDARD',
    25000,
    18500,
    18.75,
    1.8,
    ARRAY['Clean Energy', 'Climate Action', 'Affordable Energy'],
    2024,
    'verified'
),
(
    'Mangrove Restoration Philippines',
    'Coastal mangrove restoration project covering 5,000 hectares. Protects coastlines from erosion and provides habitat for marine life.',
    'Palawan, Philippines',
    'ocean_conservation',
    'VERRA',
    12000,
    8200,
    32.00,
    2.1,
    ARRAY['Life Below Water', 'Climate Action', 'Coastal Protection'],
    2024,
    'verified'
),
(
    'Wind Energy Project Kenya',
    'Large wind farm installation providing renewable energy to the national grid. Supports Kenya\'s transition to clean energy.',
    'Turkana, Kenya',
    'renewable_energy',
    'CARBON_CREDIT_STANDARD',
    30000,
    22000,
    22.25,
    2.5,
    ARRAY['Clean Energy', 'Climate Action', 'Economic Growth'],
    2024,
    'active'
),
(
    'Methane Capture Landfill USA',
    'Landfill gas capture and utilization project converting methane emissions into clean electricity.',
    'California, USA',
    'methane_capture',
    'AMERICAN_CARBON_REGISTRY',
    15000,
    12500,
    28.50,
    1.9,
    ARRAY['Climate Action', 'Waste Management', 'Clean Energy'],
    2024,
    'verified'
),
(
    'Energy Efficiency Buildings',
    'Commercial building energy efficiency retrofit program reducing energy consumption by 40%.',
    'Toronto, Canada',
    'energy_efficiency',
    'GOLD_STANDARD',
    8000,
    6500,
    35.00,
    1.5,
    ARRAY['Sustainable Cities', 'Climate Action', 'Energy Efficiency'],
    2024,
    'active'
);

-- Insert sample credits for each project
INSERT INTO public.credits (project_id, vintage_year, quantity, price, status)
SELECT 
    p.id,
    p.vintage_year,
    CASE 
        WHEN random() < 0.3 THEN 100
        WHEN random() < 0.6 THEN 250
        ELSE 500
    END as quantity,
    p.price_per_credit,
    'available'
FROM public.projects p
WHERE p.status IN ('verified', 'active');

-- Insert sample risk scores for projects
INSERT INTO public.risk_scores (
    project_id,
    environmental_risk,
    social_risk,
    governance_risk,
    overall_risk,
    methodology
)
SELECT 
    id,
    risk_score * 0.8 + random() * 0.4,
    risk_score * 0.9 + random() * 0.2,
    risk_score * 0.7 + random() * 0.6,
    risk_score,
    'AI-Powered Risk Assessment v1.0'
FROM public.projects
WHERE risk_score IS NOT NULL;

-- Insert sample benchmarks
INSERT INTO public.benchmarks (
    industry,
    project_type,
    average_price,
    average_risk_score,
    total_projects
) VALUES 
('Forestry', 'reforestation', 26.75, 2.2, 156),
('Energy', 'renewable_energy', 21.50, 1.9, 243),
('Marine', 'ocean_conservation', 31.25, 2.3, 87),
('Waste Management', 'methane_capture', 27.80, 2.0, 134),
('Construction', 'energy_efficiency', 33.50, 1.7, 98);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_location ON public.projects(location);
CREATE INDEX IF NOT EXISTS idx_credits_status ON public.credits(status);
CREATE INDEX IF NOT EXISTS idx_credits_project_id ON public.credits(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON public.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON public.credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
