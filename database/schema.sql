-- Create database
CREATE DATABASE financial_track;

-- Connect to the database
\c financial_track;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_stocks table
CREATE TABLE user_stocks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL,
    stock_name VARCHAR(255) NOT NULL,
    shares_owned DECIMAL(15,6) NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_stocks_user_id ON user_stocks(user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stocks_updated_at BEFORE UPDATE ON user_stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create portfolio summary view
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(us.id) as total_holdings,
    COALESCE(SUM(us.shares_owned * us.current_price), 0) as total_value,
    COALESCE(SUM(us.shares_owned * (us.current_price - us.purchase_price)), 0) as total_gain_loss,
    COALESCE(SUM(us.shares_owned * us.purchase_price), 0) as total_invested
FROM users u
LEFT JOIN user_stocks us ON u.id = us.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- Insert sample data
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('test@example.com', '$2b$10$rQZ8K9LmN2pQ3rS4tU5vW.abcdefghijklmnopqrstuvwxyz', 'Test', 'User');

INSERT INTO user_stocks (user_id, stock_symbol, stock_name, shares_owned, purchase_price, current_price) VALUES
(1, 'AAPL', 'Apple Inc.', 10.000000, 150.00, 150.00),
(1, 'MSFT', 'Microsoft Corporation', 5.000000, 300.00, 320.00);
