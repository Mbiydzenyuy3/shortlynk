-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- URLS TABLE
CREATE TABLE IF NOT EXISTS urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(8) UNIQUE NOT NULL,
  user_id UUID,
  long_url VARCHAR(255) NOT NULL,
  short_url TEXT,
  click_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expire_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CLICK LOGS TABLE
CREATE TABLE IF NOT EXISTS click_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_short_urls_user_id ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_click_logs_url_id ON click_logs(url_id);

-- TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_urls_updated_at') THEN
    CREATE TRIGGER update_urls_updated_at
    BEFORE UPDATE ON urls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

