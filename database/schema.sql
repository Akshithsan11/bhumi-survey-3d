-- Bhumi Survey 3D Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Parcels table (land plots)
CREATE TABLE IF NOT EXISTS parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    area_sqm DECIMAL(10, 2),
    location_lat DECIMAL(9, 6),
    location_lng DECIMAL(9, 6),
    owner_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buildings table (towers/structures)
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    height_m DECIMAL(6, 2),
    total_floors INTEGER,
    building_type VARCHAR(50) DEFAULT 'residential',
    ai_confidence DECIMAL(5, 2),
    ai_model_version VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Floors table
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    floor_height_m DECIMAL(5, 2),
    total_units INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property units (flats)
CREATE TABLE IF NOT EXISTS property_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
    unit_number VARCHAR(20),
    area_sqft DECIMAL(8, 2),
    unit_type VARCHAR(50) DEFAULT 'residential',
    occupancy_status VARCHAR(20) DEFAULT 'vacant',
    owner_name VARCHAR(100),
    rent DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ULPIN records
CREATE TABLE IF NOT EXISTS ulpins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES parcels(id) ON DELETE SET NULL,
    ulpin_code VARCHAR(50) UNIQUE NOT NULL,
    country_code VARCHAR(10) DEFAULT 'IND',
    state_code VARCHAR(10) DEFAULT 'TG',
    city_code VARCHAR(10) DEFAULT 'HYD',
    plot_code VARCHAR(20),
    building_code VARCHAR(20),
    floor_code VARCHAR(10),
    unit_code VARCHAR(10),
    total_area_sqm DECIMAL(10, 2),
    total_area_sqft DECIMAL(10, 2),
    owner_name VARCHAR(100),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated INTEGER DEFAULT 0,
    ai_confidence DECIMAL(5, 2)
);

-- Infrastructure (underground pipes, cables, etc.)
CREATE TABLE IF NOT EXISTS infrastructure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    depth_m DECIMAL(5, 2),
    length_m DECIMAL(8, 2),
    owner_authority VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI analysis jobs
CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    input_image_path VARCHAR(255),
    detected_buildings INTEGER DEFAULT 0,
    avg_confidence DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Validation results
CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    overall_score INTEGER DEFAULT 0,
    passed_rules INTEGER DEFAULT 0,
    failed_rules JSONB DEFAULT '[]',
    validation_type VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row-level security (optional, for multi-tenant)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);