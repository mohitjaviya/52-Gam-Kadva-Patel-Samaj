-- =============================================
-- Supabase Schema for Community Connect
-- Run this in Supabase SQL Editor FIRST
-- =============================================

-- Villages table
CREATE TABLE IF NOT EXISTS villages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    taluka TEXT,
    district TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    gender TEXT,
    village_id INTEGER REFERENCES villages(id),
    current_address TEXT,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    occupation_type TEXT CHECK(occupation_type IN ('student', 'job', 'business')),
    registration_completed BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    can_view_sensitive BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    profile_photo TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Student details
CREATE TABLE IF NOT EXISTS student_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    sub_department TEXT,
    college_city TEXT NOT NULL,
    college_name TEXT NOT NULL,
    year_of_study TEXT,
    expected_graduation TEXT,
    additional_info TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Job details
CREATE TABLE IF NOT EXISTS job_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    graduation_year TEXT,
    college_city TEXT,
    college_name TEXT,
    department TEXT,
    graduation_branch TEXT,
    working_city TEXT NOT NULL,
    company_name TEXT NOT NULL,
    designation TEXT,
    field TEXT NOT NULL,
    experience_years INTEGER,
    additional_info TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business details
CREATE TABLE IF NOT EXISTS business_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    business_field TEXT NOT NULL,
    business_city TEXT NOT NULL,
    business_address TEXT NOT NULL,
    years_in_business INTEGER,
    employees_count INTEGER,
    website TEXT,
    additional_info TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- OTP verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    phone TEXT,
    email TEXT,
    otp TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('phone', 'email')),
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Cities
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    state TEXT
);

-- Colleges
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    city_id INTEGER NOT NULL REFERENCES cities(id),
    type TEXT,
    UNIQUE(name, city_id)
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT
);

-- Sub-departments
CREATE TABLE IF NOT EXISTS sub_departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    UNIQUE(name, department_id)
);

-- College courses mapping
CREATE TABLE IF NOT EXISTS college_courses (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id),
    course_name TEXT NOT NULL,
    UNIQUE(college_id, course_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_village ON users(village_id);
CREATE INDEX IF NOT EXISTS idx_users_occupation ON users(occupation_type);
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(is_approved);
CREATE INDEX IF NOT EXISTS idx_student_details_user ON student_details(user_id);
CREATE INDEX IF NOT EXISTS idx_job_details_user ON job_details(user_id);
CREATE INDEX IF NOT EXISTS idx_business_details_user ON business_details(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_colleges_city ON colleges(city_id);
CREATE INDEX IF NOT EXISTS idx_sub_departments_dept ON sub_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_college_courses_college ON college_courses(college_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_student_details_updated_at BEFORE UPDATE ON student_details FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_job_details_updated_at BEFORE UPDATE ON job_details FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_business_details_updated_at BEFORE UPDATE ON business_details FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Disable RLS for all tables (server-side access with service role key)
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_courses ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service_role full access
CREATE POLICY "Service role full access" ON villages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON student_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON job_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON business_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON otp_verifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON cities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON colleges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON sub_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON college_courses FOR ALL USING (true) WITH CHECK (true);
