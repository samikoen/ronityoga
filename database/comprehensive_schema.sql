-- Comprehensive Database Schema for Ronit Yoga Website
-- This file extends the existing database with new features

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    role ENUM('student', 'instructor', 'admin') DEFAULT 'student',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    avatar VARCHAR(500),
    bio TEXT,
    experience_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    goals TEXT,
    medical_conditions TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    notification_preferences JSON,
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    language VARCHAR(10) DEFAULT 'tr',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Admin users table (extends existing admin functionality)
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    permissions JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Yoga poses database
CREATE TABLE IF NOT EXISTS yoga_poses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_turkish VARCHAR(200) NOT NULL,
    name_english VARCHAR(200) NOT NULL,
    name_sanskrit VARCHAR(200),
    category ENUM('standing', 'sitting', 'prone', 'supine', 'inversions', 'arm_balances', 'backbends', 'twists', 'hip_openers', 'core', 'relaxation') NOT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    duration_min INT DEFAULT 30, -- minimum hold time in seconds
    duration_max INT DEFAULT 60, -- maximum hold time in seconds
    description_turkish TEXT NOT NULL,
    description_english TEXT,
    benefits JSON, -- array of benefits
    contraindications JSON, -- array of contraindications
    muscle_groups JSON, -- array of targeted muscle groups
    chakras JSON, -- array of associated chakras
    preparation_poses JSON, -- array of pose IDs for preparation
    counter_poses JSON, -- array of pose IDs for counter poses
    modifications JSON, -- array of modifications for different levels
    props_needed JSON, -- array of props/equipment needed
    featured_image VARCHAR(500),
    step_by_step_images JSON, -- array of image URLs for step-by-step
    video_url VARCHAR(500),
    audio_instruction_url VARCHAR(500),
    created_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_name_turkish (name_turkish),
    INDEX idx_active (is_active),
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Meditation series and content
CREATE TABLE IF NOT EXISTS meditation_series (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('mindfulness', 'relaxation', 'chakra', 'mantra', 'breathing', 'body_scan', 'loving_kindness', 'visualization') NOT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    duration_minutes INT NOT NULL,
    series_order INT DEFAULT 1,
    audio_file_url VARCHAR(500) NOT NULL,
    background_music_url VARCHAR(500),
    transcript_turkish TEXT,
    transcript_english TEXT,
    featured_image VARCHAR(500),
    benefits JSON,
    preparation_instructions TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    play_count INT DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_duration (duration_minutes),
    INDEX idx_active (is_active),
    INDEX idx_premium (is_premium),
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Enhanced classes table (extends existing)
CREATE TABLE IF NOT EXISTS class_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('hatha', 'vinyasa', 'ashtanga', 'yin', 'restorative', 'prenatal', 'meditation', 'breathwork', 'workshop') NOT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced', 'all_levels') NOT NULL,
    duration_minutes INT NOT NULL,
    max_capacity INT DEFAULT 20,
    min_capacity INT DEFAULT 3,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    equipment_needed JSON,
    benefits JSON,
    contraindications JSON,
    featured_image VARCHAR(500),
    is_online BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active),
    INDEX idx_online (is_online)
);

-- Class schedules
CREATE TABLE IF NOT EXISTS class_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_type_id INT NOT NULL,
    instructor_id INT,
    title VARCHAR(200),
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    location VARCHAR(200),
    online_meeting_url VARCHAR(500),
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(100),
    max_participants INT,
    current_participants INT DEFAULT 0,
    price_override DECIMAL(10,2),
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    cancellation_reason TEXT,
    special_instructions TEXT,
    recording_url VARCHAR(500),
    is_recorded BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_start_datetime (start_datetime),
    INDEX idx_class_type (class_type_id),
    INDEX idx_instructor (instructor_id),
    INDEX idx_status (status),
    FOREIGN KEY (class_type_id) REFERENCES class_types(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Enhanced reservations table (extends existing)
CREATE TABLE IF NOT EXISTS class_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    class_schedule_id INT NOT NULL,
    guest_name VARCHAR(200),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    booking_type ENUM('user', 'guest') NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'refunded', 'failed') DEFAULT 'pending',
    payment_amount DECIMAL(10,2),
    payment_currency VARCHAR(3) DEFAULT 'TRY',
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(200),
    special_requests TEXT,
    cancellation_reason TEXT,
    cancelled_by ENUM('user', 'admin', 'system'),
    cancelled_at TIMESTAMP NULL,
    reminder_sent BOOLEAN DEFAULT FALSE,
    feedback_rating INT CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comment TEXT,
    attended BOOLEAN DEFAULT FALSE,
    booking_reference VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_class_schedule (class_schedule_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_booking_reference (booking_reference),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_schedule_id) REFERENCES class_schedules(id) ON DELETE CASCADE
);

-- E-commerce products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    category ENUM('mats', 'blocks', 'straps', 'bolsters', 'clothing', 'accessories', 'books', 'digital_courses') NOT NULL,
    brand VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'TRY',
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    weight_kg DECIMAL(8,2),
    dimensions JSON, -- {length, width, height}
    colors JSON, -- available colors
    sizes JSON, -- available sizes
    materials JSON, -- materials used
    care_instructions TEXT,
    features JSON, -- key features list
    images JSON, -- array of image URLs
    video_url VARCHAR(500),
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    is_digital BOOLEAN DEFAULT FALSE,
    digital_file_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_sku (sku),
    INDEX idx_featured (is_featured),
    INDEX idx_active (is_active),
    INDEX idx_name (name),
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT,
    reviewer_name VARCHAR(200),
    reviewer_email VARCHAR(255),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating),
    INDEX idx_approved (is_approved),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Shopping cart
CREATE TABLE IF NOT EXISTS shopping_cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected_color VARCHAR(50),
    selected_size VARCHAR(20),
    price_at_time DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_product_id (product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    guest_email VARCHAR(255),
    billing_address JSON NOT NULL,
    shipping_address JSON NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_transaction_id VARCHAR(200),
    payment_gateway VARCHAR(50),
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(100),
    quantity INT NOT NULL,
    selected_color VARCHAR(50),
    selected_size VARCHAR(20),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ENUM('class_attendance', 'pose_practice', 'meditation', 'challenge_completion', 'goal_achievement') NOT NULL,
    activity_id INT, -- References class_schedules, yoga_poses, meditation_series, etc.
    activity_name VARCHAR(200) NOT NULL,
    progress_data JSON, -- Flexible data storage for different activity types
    duration_minutes INT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced'),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User goals and challenges
CREATE TABLE IF NOT EXISTS user_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_type ENUM('practice_frequency', 'duration', 'pose_mastery', 'meditation_streak', 'flexibility', 'strength', 'balance', 'custom') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value INT, -- e.g., practice 3 times per week, hold pose for 60 seconds
    target_unit VARCHAR(50), -- e.g., 'times_per_week', 'seconds', 'days'
    current_value INT DEFAULT 0,
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    reward_description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_goal_type (goal_type),
    INDEX idx_status (status),
    INDEX idx_target_date (target_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Challenges (30-day programs, etc.)
CREATE TABLE IF NOT EXISTS challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    duration_days INT NOT NULL,
    category ENUM('beginner_foundation', 'flexibility', 'strength', 'meditation', 'balance', 'breathwork', 'custom') NOT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    daily_activities JSON NOT NULL, -- Array of daily activities/poses/meditations
    featured_image VARCHAR(500),
    benefits JSON,
    requirements JSON,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    participant_count INT DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active),
    INDEX idx_premium (is_premium),
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- User challenge enrollments
CREATE TABLE IF NOT EXISTS user_challenge_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    challenge_id INT NOT NULL,
    start_date DATE NOT NULL,
    target_end_date DATE NOT NULL,
    current_day INT DEFAULT 1,
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed_days JSON, -- Array of completed day numbers
    streak_count INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_user_challenge_active (user_id, challenge_id, status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type ENUM('class_reminder', 'booking_confirmation', 'payment_success', 'challenge_reminder', 'goal_achievement', 'general', 'promotion') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    action_text VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    send_email BOOLEAN DEFAULT FALSE,
    send_sms BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    scheduled_for DATETIME,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_scheduled_for (scheduled_for),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Gift certificates
CREATE TABLE IF NOT EXISTS gift_certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    purchased_by_user_id INT,
    purchased_by_name VARCHAR(200),
    purchased_by_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(200),
    recipient_email VARCHAR(255),
    gift_message TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    remaining_amount DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'redeemed', 'expired', 'cancelled') DEFAULT 'active',
    expires_at DATE NOT NULL,
    redeemed_by_user_id INT,
    redeemed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (purchased_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (redeemed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Loyalty program
CREATE TABLE IF NOT EXISTS loyalty_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points_earned INT NOT NULL,
    points_spent INT DEFAULT 0,
    current_balance INT NOT NULL,
    activity_type ENUM('class_attendance', 'referral', 'purchase', 'challenge_completion', 'review', 'birthday_bonus', 'manual_adjustment') NOT NULL,
    activity_description VARCHAR(300) NOT NULL,
    reference_id INT, -- Can reference orders, bookings, etc.
    expires_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Referral system
CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_user_id INT NOT NULL,
    referred_email VARCHAR(255) NOT NULL,
    referred_user_id INT,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
    reward_amount DECIMAL(10,2) DEFAULT 0.00,
    reward_type ENUM('discount', 'points', 'free_class') DEFAULT 'discount',
    reward_given BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    expires_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_referrer_user_id (referrer_user_id),
    INDEX idx_referred_user_id (referred_user_id),
    INDEX idx_referral_code (referral_code),
    INDEX idx_status (status),
    FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Website analytics and tracking
CREATE TABLE IF NOT EXISTS page_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255),
    page_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    referrer_url VARCHAR(500),
    user_agent TEXT,
    ip_address VARCHAR(45),
    country VARCHAR(100),
    city VARCHAR(100),
    device_type ENUM('desktop', 'tablet', 'mobile') DEFAULT 'desktop',
    browser VARCHAR(100),
    time_on_page INT, -- seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_page_url (page_url),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- System settings and configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value LONGTEXT,
    setting_type ENUM('string', 'integer', 'float', 'boolean', 'json', 'text') DEFAULT 'string',
    category VARCHAR(100) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category),
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Insert default system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('site_name', 'Ronit Yoga Studio', 'string', 'general', 'Site name', TRUE),
('contact_email', 'info@ronityoga.com', 'string', 'contact', 'Main contact email', TRUE),
('contact_phone', '+90 555 123 4567', 'string', 'contact', 'Main contact phone', TRUE),
('business_address', 'İstanbul, Türkiye', 'string', 'contact', 'Business address', TRUE),
('currency', 'TRY', 'string', 'payment', 'Default currency', FALSE),
('timezone', 'Europe/Istanbul', 'string', 'general', 'Site timezone', FALSE),
('class_booking_advance_days', '30', 'integer', 'booking', 'Days in advance users can book classes', FALSE),
('cancellation_window_hours', '24', 'integer', 'booking', 'Hours before class when cancellation is allowed', FALSE),
('loyalty_points_per_class', '10', 'integer', 'loyalty', 'Points earned per class attendance', FALSE),
('referral_discount_percentage', '20', 'integer', 'referral', 'Discount percentage for referrals', FALSE),
('smtp_host', '', 'string', 'email', 'SMTP server host', FALSE),
('smtp_port', '587', 'integer', 'email', 'SMTP server port', FALSE),
('smtp_username', '', 'string', 'email', 'SMTP username', FALSE),
('smtp_password', '', 'string', 'email', 'SMTP password', FALSE),
('sms_api_key', '', 'string', 'sms', 'SMS service API key', FALSE),
('payment_stripe_public_key', '', 'string', 'payment', 'Stripe public key', FALSE),
('payment_stripe_secret_key', '', 'string', 'payment', 'Stripe secret key', FALSE),
('zoom_api_key', '', 'string', 'integration', 'Zoom API key', FALSE),
('zoom_api_secret', '', 'string', 'integration', 'Zoom API secret', FALSE);

-- Create initial admin user
INSERT IGNORE INTO admin_users (username, email, password, full_name, role, permissions, status) VALUES
('admin', 'admin@ronityoga.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'super_admin', '["all"]', 'active');