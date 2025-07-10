-- Rsustain Carbon Exchange Database Setup
-- This script sets up the complete database schema for the carbon credit exchange platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('buyer', 'seller', 'verifier', 'admin')) DEFAULT 'buyer',
    company_name TEXT,
    country TEXT,
    full_name TEXT,
    phone_number TEXT,
    address TEXT,
    business_details JSONB,
    notification_preferences JSONB DEFAULT '{"email_notifications": true, "in_app_alerts": true}',
    security_settings JSONB DEFAULT '{"two_factor_enabled": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carbon projects table (enhanced)
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    project_type TEXT CHECK (project_type IN ('reforestation', 'renewable_energy', 'energy_efficiency', 'methane_capture', 'ocean_conservation')) NOT NULL,
    certification TEXT CHECK (certification IN ('VERRA', 'GOLD_STANDARD', 'CARBON_CREDIT_STANDARD', 'AMERICAN_CARBON_REGISTRY')) NOT NULL,
    total_credits INTEGER NOT NULL,
    available_credits INTEGER NOT NULL,
    price_per_credit DECIMAL(10,2) NOT NULL,
    risk_score DECIMAL(3,2) CHECK (risk_score >= 0 AND risk_score <= 10),
    sdg_goals TEXT[],
    vintage_year INTEGER,
    seller_id UUID REFERENCES public.users(id),
    status TEXT CHECK (status IN ('draft', 'pending_verification', 'verified', 'rejected', 'active', 'completed')) DEFAULT 'draft',
    verification_status TEXT CHECK (verification_status IN ('not_submitted', 'submitted', 'in_review', 'approved', 'rejected')) DEFAULT 'not_submitted',
    impact_story TEXT,
    media_gallery TEXT[],
    certification_details JSONB,
    project_documents JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping cart table
CREATE TABLE public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- Carbon credits table (enhanced)
CREATE TABLE public.credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    vintage_year INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('available', 'reserved', 'sold', 'retired')) DEFAULT 'available',
    buyer_id UUID REFERENCES public.users(id),
    retirement_reason TEXT,
    retirement_date TIMESTAMP WITH TIME ZONE,
    certificate_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced transactions table
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    buyer_id UUID REFERENCES public.users(id),
    seller_id UUID REFERENCES public.users(id),
    project_id UUID REFERENCES public.projects(id),
    quantity INTEGER NOT NULL,
    price_per_credit DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    payment_intent_id TEXT,
    payment_method TEXT,
    payment_status TEXT CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificates table
CREATE TABLE public.certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    certificate_type TEXT CHECK (certificate_type IN ('retirement', 'verification', 'purchase')) NOT NULL,
    user_id UUID REFERENCES public.users(id),
    project_id UUID REFERENCES public.projects(id),
    transaction_id UUID REFERENCES public.transactions(id),
    credit_id UUID REFERENCES public.credits(id),
    certificate_number TEXT UNIQUE NOT NULL,
    quantity INTEGER,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pdf_url TEXT,
    verification_seal TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced verifications table
CREATE TABLE public.verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES public.users(id),
    status TEXT CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'revision_requested')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    comments TEXT,
    findings TEXT,
    supporting_evidence_url TEXT,
    decision_reason TEXT,
    verification_date TIMESTAMP WITH TIME ZONE,
    assigned_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project documents table
CREATE TABLE public.project_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    version INTEGER DEFAULT 1,
    uploaded_by UUID REFERENCES public.users(id),
    status TEXT CHECK (status IN ('uploaded', 'reviewed', 'approved', 'rejected')) DEFAULT 'uploaded',
    reviewer_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    project_id UUID REFERENCES public.projects(id),
    transaction_id UUID REFERENCES public.transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk scores table (enhanced)
CREATE TABLE public.risk_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    environmental_risk DECIMAL(3,2),
    social_risk DECIMAL(3,2),
    governance_risk DECIMAL(3,2),
    overall_risk DECIMAL(3,2),
    methodology TEXT,
    ai_analysis JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Benchmarks table
CREATE TABLE public.benchmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    industry TEXT NOT NULL,
    project_type TEXT NOT NULL,
    average_price DECIMAL(10,2),
    average_risk_score DECIMAL(3,2),
    total_projects INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base table
CREATE TABLE public.knowledge_base (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    target_roles TEXT[],
    featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE public.support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    assigned_to UUID REFERENCES public.users(id),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment records table
CREATE TABLE public.payment_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    transaction_id UUID REFERENCES public.transactions(id),
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit issuance tracking
CREATE TABLE public.credit_issuances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id),
    buyer_id UUID REFERENCES public.users(id),
    quantity INTEGER NOT NULL,
    issuance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('issued', 'pending_verification')) DEFAULT 'issued',
    verification_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_issuances ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Anyone can view verified projects" ON public.projects
    FOR SELECT USING (status = 'verified' OR status = 'active');

CREATE POLICY "Sellers can manage their own projects" ON public.projects
    FOR ALL USING (
        auth.uid() = seller_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'verifier'))
    );

-- Cart policies
CREATE POLICY "Users can manage their own cart" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id);

-- Credits policies
CREATE POLICY "Anyone can view available credits" ON public.credits
    FOR SELECT USING (status = 'available');

CREATE POLICY "Buyers can view their purchased credits" ON public.credits
    FOR SELECT USING (auth.uid() = buyer_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Buyers can create transactions" ON public.transactions
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'buyer')
    );

-- Certificates policies
CREATE POLICY "Users can view their own certificates" ON public.certificates
    FOR SELECT USING (auth.uid() = user_id);

-- Verifications policies
CREATE POLICY "Verifiers can manage verifications" ON public.verifications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('verifier', 'admin'))
    );

CREATE POLICY "Project owners can view their verifications" ON public.verifications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND seller_id = auth.uid())
    );

-- Activity logs policies
CREATE POLICY "Users can view their own activity" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Knowledge base policies  
CREATE POLICY "Everyone can view knowledge base" ON public.knowledge_base
    FOR SELECT USING (true);

-- Support tickets policies
CREATE POLICY "Users can manage their own tickets" ON public.support_tickets
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Payment records policies
CREATE POLICY "Users can view their own payments" ON public.payment_records
    FOR SELECT USING (auth.uid() = user_id);

-- Credit issuances policies
CREATE POLICY "Users can view relevant issuances" ON public.credit_issuances
    FOR SELECT USING (
        auth.uid() = buyer_id OR
        EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND seller_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'verifier'))
    );

-- Indexes for performance optimization
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_seller ON public.projects(seller_id);
CREATE INDEX idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_credits_status ON public.credits(status);
CREATE INDEX idx_credits_buyer ON public.credits(buyer_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at);
CREATE INDEX idx_verifications_status ON public.verifications(status);
CREATE INDEX idx_verifications_verifier ON public.verifications(verifier_id);
CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);

-- Functions for automated operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON public.credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_transaction_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO public.activity_logs (user_id, activity_type, description, metadata, project_id, transaction_id)
    VALUES (p_user_id, p_activity_type, p_description, p_metadata, p_project_id, p_transaction_id)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate cart total
CREATE OR REPLACE FUNCTION get_cart_total(p_user_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    total DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO total
    FROM public.cart_items
    WHERE user_id = p_user_id;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data for testing (remove in production)
INSERT INTO public.users (id, email, role, company_name, country, full_name) VALUES
    ('00000000-0000-0000-0000-000000000001', 'buyer@example.com', 'buyer', 'Green Corp', 'United States', 'John Buyer'),
    ('00000000-0000-0000-0000-000000000002', 'seller@example.com', 'seller', 'Carbon Solutions Inc', 'Canada', 'Jane Seller'),
    ('00000000-0000-0000-0000-000000000003', 'verifier@example.com', 'verifier', 'Verify Co', 'United Kingdom', 'Bob Verifier')
ON CONFLICT (id) DO NOTHING;

-- Sample projects for testing
INSERT INTO public.projects (name, description, location, project_type, certification, total_credits, available_credits, price_per_credit, seller_id, status, vintage_year, sdg_goals) VALUES
    ('Amazon Rainforest Restoration', 'Large-scale reforestation project in the Amazon basin', 'Brazil', 'reforestation', 'VERRA', 100000, 75000, 12.50, '00000000-0000-0000-0000-000000000002', 'verified', 2023, ARRAY['Climate Action', 'Life on Land']),
    ('Solar Farm Initiative', 'Utility-scale solar power generation', 'California, USA', 'renewable_energy', 'GOLD_STANDARD', 50000, 40000, 15.75, '00000000-0000-0000-0000-000000000002', 'verified', 2023, ARRAY['Clean Energy', 'Climate Action']),
    ('Methane Capture Facility', 'Landfill methane capture and utilization', 'Texas, USA', 'methane_capture', 'AMERICAN_CARBON_REGISTRY', 30000, 25000, 18.00, '00000000-0000-0000-0000-000000000002', 'verified', 2023, ARRAY['Climate Action'])
ON CONFLICT DO NOTHING;
