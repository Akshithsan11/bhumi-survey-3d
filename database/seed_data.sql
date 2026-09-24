-- Bhumi Survey 3D Seed Data
-- Starter data for Hyderabad demo
-- Admin users are created only via ADMIN_EMAIL / ADMIN_PASSWORD env vars (never hardcoded here).

-- Insert sample parcels
INSERT INTO parcels (code, name, area_sqm, location_lat, location_lng, owner_name, status)
VALUES 
('PRC-001', 'Survey Plot 1', 2500.50, 17.3850, 78.4867, 'Municipal Authority', 'active'),
('PRC-002', 'Survey Plot 2', 3200.75, 17.3900, 78.4900, 'Private Owner', 'active'),
('PRC-003', 'Survey Plot 3', 1850.25, 17.3750, 78.4800, 'Municipal Authority', 'active');

-- Insert sample buildings
INSERT INTO buildings (parcel_id, code, height_m, total_floors, building_type, ai_confidence, status)
VALUES 
-- Building 1: 12-floor residential
(GEN_RANDOM_UUID(), 'BLD-001', 38.5, 12, 'residential', 94.5, 'active'),
-- Building 2: 8-floor residential
(GEN_RANDOM_UUID(), 'BLD-002', 25.2, 8, 'residential', 89.2, 'active'),
-- Building 3: 5-floor commercial
(GEN_RANDOM_UUID(), 'BLD-003', 18.0, 5, 'commercial', 91.8, 'active');

-- Insert sample floors
INSERT INTO floors (building_id, floor_number, floor_height_m, total_units)
VALUES 
-- Floors for Building 1
(GEN_RANDOM_UUID(), 1, 3.5, 4),
(GEN_RANDOM_UUID(), 2, 3.5, 4),
(GEN_RANDOM_UUID(), 3, 3.5, 4),
-- Floors for Building 2
(GEN_RANDOM_UUID(), 1, 3.2, 3),
(GEN_RANDOM_UUID(), 2, 3.2, 3),
-- Floors for Building 3
(GEN_RANDOM_UUID(), 1, 3.8, 2);

-- Insert sample property units
INSERT INTO property_units (floor_id, unit_number, area_sqft, unit_type, occupancy_status, owner_name, rent)
VALUES 
-- Units on Floor 1 of Building 1
(GEN_RANDOM_UUID(), 'A-101', 1200.5, 'residential', 'owned', 'John Doe', 15000),
(GEN_RANDOM_UUID(), 'A-102', 1150.0, 'residential', 'rented', 'Smith Family', 14000),
-- Units on Floor 2 of Building 1
(GEN_RANDOM_UUID(), 'A-201', 1250.0, 'residential', 'owned', 'Jane Doe', 15500),
-- Units on Floor 1 of Building 2
(GEN_RANDOM_UUID(), 'B-101', 950.0, 'residential', 'vacant', NULL, NULL),
-- Insert sample ULPIN records
INSERT INTO ulpins (ulpin_code, country_code, state_code, city_code, plot_code, building_code, floor_code, unit_code, total_area_sqm, total_area_sqft, owner_name, validated)
VALUES 
('IND-TG-HYD-PRC-001-BLD-001-F01-U01', 'IND', 'TG', 'HYD', 'PRC-001', 'BLD-001', 'F01', 'U01', 150.5, 1620, 'John Doe', 1),
('IND-TG-HYD-PRC-002-BLD-002-F01-U01', 'IND', 'TG', 'HYD', 'PRC-002', 'BLD-002', 'F01', 'U01', 135.2, 1455, 'Smith Family', 1);

-- Insert sample infrastructure
INSERT INTO infrastructure (building_id, type, name, depth_m, length_m, owner_authority, status)
VALUES 
(GEN_RANDOM_UUID(), 'water', 'Main Water Pipeline', 3.5, 120.5, 'Municipal Authority', 'active'),
(GEN_RANDOM_UUID(), 'power', 'Electrical Cable', 2.8, 85.3, 'TNEPDCL', 'active'),
(GEN_RANDOM_UUID(), 'sewage', 'Sewer Line', 4.2, 95.0, 'Municipal Authority', 'active');

-- Insert sample AI jobs
INSERT INTO ai_jobs (detected_buildings, avg_confidence, status)
VALUES 
(5, 92.5, 'completed'),
(3, 88.7, 'completed');

-- Insert validation results
INSERT INTO validation_results (overall_score, passed_rules, failed_rules, validation_type)
VALUES 
(85, 5, '[water_pipe_conflict]', 'standard'),
(92, 6, NULL, 'strict');