-- Create database (run this manually first)
-- CREATE DATABASE financial_track;

-- Connect to the database and run the following:

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_stocks table
CREATE TABLE IF NOT EXISTS user_stocks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL,
    stock_name VARCHAR(255) NOT NULL,
    shares_owned DECIMAL(15, 4) NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2) DEFAULT 0,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_stocks_user_id ON user_stocks(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stocks_updated_at BEFORE UPDATE ON user_stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test', 'User')
ON CONFLICT (email) DO NOTHING;

-- Create portfolio summary view
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    COALESCE(SUM(us.shares_owned * us.current_price), 0) as total_value,
    COALESCE(SUM(us.shares_owned * us.purchase_price), 0) as total_invested,
    COALESCE(SUM(us.shares_owned * us.current_price) - SUM(us.shares_owned * us.purchase_price), 0) as total_gain_loss,
    COUNT(us.id) as total_holdings
FROM users u
LEFT JOIN user_stocks us ON u.id = us.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name;
