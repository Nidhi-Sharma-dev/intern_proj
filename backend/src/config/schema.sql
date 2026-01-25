-- ==========================================
-- MANNSik DATABASE SCHEMA
-- ==========================================

-- Enable UUID extension (for generating unique IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLE: users
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);

-- ==========================================
-- TABLE: user_profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  age_group VARCHAR(20),  -- '13-19', '20-25', '25-30', etc.
  gender VARCHAR(20),     -- 'Male', 'Female', 'Transgender', 'Other'
  occupation VARCHAR(100),
  location VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user_id ON user_profiles(user_id);

-- ==========================================
-- TABLE: personas
-- ==========================================
CREATE TABLE IF NOT EXISTS personas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,  -- 'Health', 'Habit', 'Relationship', etc.
  agents JSONB DEFAULT '[]',      -- Array of selected agents: ["Exercise", "Yoga"]
  is_mandatory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category)
);

CREATE INDEX idx_personas_user_id ON personas(user_id);
CREATE INDEX idx_personas_category ON personas(category);
CREATE INDEX idx_personas_agents ON personas USING GIN(agents);

-- ==========================================
-- TABLE: activity_logs
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  logged_time TIME,
  category VARCHAR(50) NOT NULL,
  agent VARCHAR(100) NOT NULL,
  duration_minutes INTEGER,        -- Duration in minutes
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 5),  -- 1=painful, 5=excellent
  sentiment VARCHAR(20),            -- 'positive', 'negative', 'neutral'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_user_date ON activity_logs(user_id, logged_date);
CREATE INDEX idx_activities_category ON activity_logs(category);

-- ==========================================
-- TABLE: daily_aggregates
-- ==========================================
CREATE TABLE IF NOT EXISTS daily_aggregates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category_stats JSONB DEFAULT '{}',  -- {category: {total_minutes, avg_mood, count}}
  total_activities INTEGER DEFAULT 0,
  avg_mood DECIMAL(3,2),
  variance_score DECIMAL(10,4),       -- Standard deviation across categories
  balance_score DECIMAL(5,2),         -- 0-100 score
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_agg_user_date ON daily_aggregates(user_id, date);

-- ==========================================
-- TABLE: weekly_aggregates
-- ==========================================
CREATE TABLE IF NOT EXISTS weekly_aggregates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  category_stats JSONB DEFAULT '{}',
  total_activities INTEGER DEFAULT 0,
  avg_mood DECIMAL(3,2),
  variance_score DECIMAL(10,4),
  balance_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_agg_user_week ON weekly_aggregates(user_id, week_start);

-- ==========================================
-- TABLE: monthly_aggregates
-- ==========================================
CREATE TABLE IF NOT EXISTS monthly_aggregates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,             -- 1-12
  year INTEGER NOT NULL,
  category_stats JSONB DEFAULT '{}',
  total_activities INTEGER DEFAULT 0,
  avg_mood DECIMAL(3,2),
  variance_score DECIMAL(10,4),
  balance_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, year, month)
);

CREATE INDEX idx_monthly_agg_user_month ON monthly_aggregates(user_id, year, month);

-- ==========================================
-- TABLE: assessments
-- ==========================================
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  assessment_type VARCHAR(50) NOT NULL,  -- 'PSS-14', 'PHQ-9', etc.
  responses JSONB NOT NULL,               -- Store all question responses
  total_score INTEGER,
  severity_level VARCHAR(20),             -- 'Low', 'Moderate', 'High'
  assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);

-- ==========================================
-- TABLE: recommendations
-- ==========================================
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50),        -- 'activity', 'therapy', 'consultation'
  severity_level VARCHAR(20),             -- 'Mild', 'Moderate', 'Critical'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  priority INTEGER DEFAULT 1,             -- 1=low, 5=urgent
  status VARCHAR(20) DEFAULT 'pending',   -- 'pending', 'viewed', 'completed', 'dismissed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_recommendations_user_status ON recommendations(user_id, status);

-- ==========================================
-- TABLE: rewards
-- ==========================================
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50),                -- 'balanced_week', 'consistent_logging', etc.
  points INTEGER DEFAULT 0,
  title VARCHAR(255),
  description TEXT,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewards_user_id ON rewards(user_id);

-- ==========================================
-- TABLE: consultants (for admin reference)
-- ==========================================
CREATE TABLE IF NOT EXISTS consultants (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  specialization VARCHAR(100),
  qualification VARCHAR(255),
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consultants_location ON consultants(location);

-- ==========================================
-- TABLE: consultation_referrals
-- ==========================================
CREATE TABLE IF NOT EXISTS consultation_referrals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  consultant_id INTEGER REFERENCES consultants(id),
  severity_level VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',   -- 'pending', 'scheduled', 'completed', 'cancelled'
  scheduled_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referrals_user_id ON consultation_referrals(user_id);
CREATE INDEX idx_referrals_status ON consultation_referrals(status);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_agg_updated_at BEFORE UPDATE ON daily_aggregates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_agg_updated_at BEFORE UPDATE ON weekly_aggregates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_agg_updated_at BEFORE UPDATE ON monthly_aggregates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultants_updated_at BEFORE UPDATE ON consultants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON consultation_referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SEED DATA: Category Dictionary
-- ==========================================

-- This will be used by the application
-- Stored as reference data

COMMENT ON TABLE personas IS 'User persona categories and selected agents';
COMMENT ON COLUMN personas.agents IS 'JSONB array of agent names selected by user for this category';

-- ==========================================
-- COMPLETED
-- ==========================================

SELECT 'Database schema created successfully!' AS message;