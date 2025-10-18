-- Sample data for development/testing
-- This file can be shared via git

-- Insert sample users
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('demo@betaflow.com', '$2b$10$rQZ8K9LmN3pO4qR5sT6uVeWxYzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q', 'Demo', 'User'),
('john@example.com', '$2b$10$rQZ8K9LmN3pO4qR5sT6uVeWxYzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q', 'John', 'Doe'),
('jane@example.com', '$2b$10$rQZ8K9LmN3pO4qR5sT6uVeWxYzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q', 'Jane', 'Smith')
ON CONFLICT (email) DO NOTHING;

-- Insert sample stock holdings
INSERT INTO user_stocks (user_id, stock_symbol, stock_name, shares_owned, purchase_price, current_price) VALUES
(1, 'AAPL', 'Apple Inc.', 10, 150.00, 175.50),
(1, 'GOOGL', 'Alphabet Inc.', 5, 2800.00, 2850.75),
(1, 'TSLA', 'Tesla Inc.', 8, 200.00, 220.25),
(2, 'MSFT', 'Microsoft Corporation', 15, 300.00, 315.80),
(2, 'AMZN', 'Amazon.com Inc.', 3, 3200.00, 3100.50),
(3, 'NVDA', 'NVIDIA Corporation', 12, 400.00, 450.25)
ON CONFLICT (user_id, stock_symbol) DO NOTHING;
