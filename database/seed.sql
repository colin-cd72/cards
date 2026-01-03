-- Broadcast Cards Seed Data
-- Run this after schema.sql to insert default data

USE broadcast_cards;

-- Default admin user (password: admin123 - CHANGE THIS IMMEDIATELY)
-- Password hash generated with bcrypt, rounds=10
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@4tmrw.net', '$2a$10$rQnM1.HvK5J5h5h5h5h5h.5h5h5h5h5h5h5h5h5h5h5h5h5h5h5h5h', 'admin');

-- Default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('card_style', '{"backgroundColor": "#ffffff", "headerColor": "#000000", "badgeColor": "#ffff00", "fontFamily": "Georgia, serif", "fontSize": "20px"}', 'Default card styling'),
('output_settings', '{"blankOnStartup": true, "transitionDuration": 300}', 'Output page behavior settings');
