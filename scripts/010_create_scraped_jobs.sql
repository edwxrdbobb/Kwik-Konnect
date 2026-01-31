-- Create scraped_jobs table for job scraping functionality
-- This table will store jobs scraped from LinkedIn, career.sl, and other sources

CREATE TABLE IF NOT EXISTS scraped_jobs (
    id VARCHAR(255) PRIMARY KEY, -- Composite ID including source and timestamp
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- Full-time, Part-time, Contract, Gig
    salary VARCHAR(255),
    skills TEXT[], -- Array of skills
    posted_at VARCHAR(100), -- Relative time like "2 days ago"
    description TEXT,
    url TEXT, -- Original job posting URL
    source VARCHAR(50) NOT NULL, -- 'linkedin', 'careersl', etc.
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'removed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_source ON scraped_jobs(source);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_status ON scraped_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_scraped_at ON scraped_jobs(scraped_at);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_location ON scraped_jobs(location);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_company ON scraped_jobs(company);

-- Create GIN index for skills array (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_skills ON scraped_jobs USING GIN(skills);

-- Add RLS (Row Level Security) policies
ALTER TABLE scraped_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read scraped jobs
CREATE POLICY "Authenticated users can view scraped jobs" ON scraped_jobs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to insert/update scraped jobs
CREATE POLICY "Service role can manage scraped jobs" ON scraped_jobs
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scraped_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_scraped_jobs_updated_at
    BEFORE UPDATE ON scraped_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_scraped_jobs_updated_at();

-- Create job_scraping_logs table to track scraping activities
CREATE TABLE IF NOT EXISTS job_scraping_logs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    keywords TEXT,
    location VARCHAR(255),
    jobs_found INTEGER DEFAULT 0,
    jobs_saved INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- 'success', 'error', 'partial'
    error_message TEXT,
    scraping_duration_seconds INTEGER,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scraping logs
CREATE INDEX IF NOT EXISTS idx_job_scraping_logs_source ON job_scraping_logs(source);
CREATE INDEX IF NOT EXISTS idx_job_scraping_logs_scraped_at ON job_scraping_logs(scraped_at);
CREATE INDEX IF NOT EXISTS idx_job_scraping_logs_status ON job_scraping_logs(status);

-- Add RLS for scraping logs
ALTER TABLE job_scraping_logs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read scraping logs
CREATE POLICY "Authenticated users can view scraping logs" ON job_scraping_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to manage scraping logs
CREATE POLICY "Service role can manage scraping logs" ON job_scraping_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Insert sample data for testing
INSERT INTO scraped_jobs (
    id, title, company, location, type, salary, skills, posted_at, description, url, source
) VALUES 
(
    'sample_linkedin_1',
    'Frontend Developer',
    'Tech Company SL',
    'Freetown, Sierra Leone',
    'Full-time',
    '$2,500-4,000/month',
    ARRAY['React', 'TypeScript', 'CSS', 'JavaScript'],
    '1 week ago',
    'Looking for an experienced frontend developer to join our team...',
    'https://linkedin.com/jobs/view/frontend-dev-123',
    'linkedin'
),
(
    'sample_careersl_1',
    'Program Manager',
    'NGO Sierra Leone',
    'Freetown, Sierra Leone',
    'Full-time',
    'SLE 6,000-8,000/month',
    ARRAY['Project Management', 'Monitoring', 'Evaluation', 'Reporting'],
    '3 days ago',
    'Manage development programs and ensure successful implementation...',
    'https://careers.sl/jobs/program-manager-456',
    'careersl'
)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON scraped_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scraped_jobs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON job_scraping_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON job_scraping_logs TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
