-- =============================================================================
-- Novada Authentication System - Database Schema
-- =============================================================================
-- Version: 1.1.0
-- Database: MySQL 8.0+ / MariaDB 10.5+
-- Description: Core database schema for the Novada dashboard ecosystem
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Database Creation (Optional - uncomment if needed)
-- -----------------------------------------------------------------------------
-- CREATE DATABASE IF NOT EXISTS novada_auth
--     DEFAULT CHARACTER SET utf8mb4
--     DEFAULT COLLATE utf8mb4_unicode_ci;
-- USE novada_auth;

-- -----------------------------------------------------------------------------
-- Table: users
-- Description: Core user authentication and profile information
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    -- Primary Key
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    
    -- User Identity
    username VARCHAR(50) NOT NULL COMMENT 'Display username (shown as Proxy_{username})',
    email VARCHAR(255) NOT NULL COMMENT 'Email address for login and communication',
    
    -- Authentication
    -- SECURITY: Password stored as BCrypt hash (cost factor 12)
    -- NEVER store plaintext passwords
    password_hash VARCHAR(255) NOT NULL COMMENT 'BCrypt hashed password - NEVER store plaintext',
    
    -- Account Status
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active' COMMENT 'Account status flag',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Registration timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    
    -- Constraints
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_username (username),
    KEY idx_users_status (status),
    KEY idx_users_created_at (created_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User authentication and profile data';

-- -----------------------------------------------------------------------------
-- Table: orders
-- Description: Order and service subscription records
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    -- Primary Key
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    
    -- Foreign Key Reference
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to users table',
    
    -- Order Identification
    order_number VARCHAR(32) NOT NULL COMMENT 'Business order number (format: OXY-YYYYMMDD-XXXXX)',
    
    -- Service Configuration (Reserved for future use)
    plan_type VARCHAR(50) DEFAULT NULL COMMENT 'Subscription plan type (e.g., starter, pro, enterprise)',
    server_config JSON DEFAULT NULL COMMENT 'Server configuration in JSON format',
    
    -- Financial Information
    order_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Original order amount',
    order_created_at TIMESTAMP NOT NULL COMMENT 'When the order was initiated',
    paid_amount DECIMAL(12, 2) DEFAULT NULL COMMENT 'Actual paid amount (may differ due to discounts)',
    paid_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Actual payment timestamp',
    
    -- Order Status
    status ENUM(
        'pending',      -- Order created, awaiting payment
        'processing',   -- Payment received, processing service
        'active',       -- Service is active
        'completed',    -- Service period ended normally
        'cancelled',    -- Order cancelled before payment
        'refunded',     -- Payment refunded
        'expired'       -- Order expired without payment
    ) NOT NULL DEFAULT 'pending' COMMENT 'Current order status',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
    
    -- Constraints
    PRIMARY KEY (id),
    UNIQUE KEY uk_orders_order_number (order_number),
    KEY idx_orders_user_id (user_id),
    KEY idx_orders_status (status),
    KEY idx_orders_order_created_at (order_created_at),
    KEY idx_orders_paid_at (paid_at),
    
    -- Foreign Key
    CONSTRAINT fk_orders_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
        
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Order and subscription records';

-- -----------------------------------------------------------------------------
-- Table: login_attempts (Security - Rate Limiting Support)
-- Description: Track failed login attempts for security
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    
    -- Tracking Information
    ip_address VARCHAR(45) NOT NULL COMMENT 'IPv4 or IPv6 address',
    email VARCHAR(255) DEFAULT NULL COMMENT 'Attempted email (may not exist)',
    user_agent TEXT DEFAULT NULL COMMENT 'Browser user agent string',
    
    -- Attempt Details
    success BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether login was successful',
    failure_reason VARCHAR(100) DEFAULT NULL COMMENT 'Reason for failure if applicable',
    
    -- Timestamps
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Attempt timestamp',
    
    -- Constraints
    PRIMARY KEY (id),
    KEY idx_login_attempts_ip (ip_address),
    KEY idx_login_attempts_email (email),
    KEY idx_login_attempts_attempted_at (attempted_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Login attempt tracking for security';

-- -----------------------------------------------------------------------------
-- Table: captcha_sessions (Security - Anti-Bot Protection)
-- Description: Server-side captcha verification storage
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS captcha_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    
    -- Session Token
    token VARCHAR(64) NOT NULL COMMENT 'Unique captcha session token',
    
    -- Captcha Data (stored encrypted)
    answer_hash VARCHAR(255) NOT NULL COMMENT 'Hashed captcha answer',
    
    -- Validity
    expires_at TIMESTAMP NOT NULL COMMENT 'Token expiration time',
    is_used BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether token has been consumed',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    PRIMARY KEY (id),
    UNIQUE KEY uk_captcha_token (token),
    KEY idx_captcha_expires_at (expires_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Captcha verification sessions';


-- -----------------------------------------------------------------------------
-- Table: revoked_tokens (Security - Session Revocation)
-- Description: Store hashed token fingerprints so logout is durable across restarts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revoked_tokens (
    token_hash CHAR(64) NOT NULL COMMENT 'SHA-256 hash of token jti (or token fallback)',
    token_type ENUM('access', 'refresh') NOT NULL DEFAULT 'access' COMMENT 'Revoked token category',
    expires_at TIMESTAMP NOT NULL COMMENT 'Original token expiry time',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Revocation timestamp',

    PRIMARY KEY (token_hash),
    KEY idx_revoked_tokens_expires_at (expires_at),
    KEY idx_revoked_tokens_type (token_type)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Durable token revocation store';

-- -----------------------------------------------------------------------------
-- Cleanup: Auto-delete expired captcha sessions (Event Scheduler)
-- -----------------------------------------------------------------------------
-- Note: Requires event_scheduler to be ON
-- SET GLOBAL event_scheduler = ON;

DELIMITER //
CREATE EVENT IF NOT EXISTS cleanup_expired_captcha
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM captcha_sessions WHERE expires_at < NOW();
END//
DELIMITER ;

-- -----------------------------------------------------------------------------
-- Cleanup: Auto-delete old login attempts (Event Scheduler)
-- -----------------------------------------------------------------------------
DELIMITER //
CREATE EVENT IF NOT EXISTS cleanup_old_login_attempts
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    -- Keep last 30 days of login attempts
    DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END//
DELIMITER ;


-- -----------------------------------------------------------------------------
-- Cleanup: Auto-delete expired revoked token fingerprints (Event Scheduler)
-- -----------------------------------------------------------------------------
DELIMITER //
CREATE EVENT IF NOT EXISTS cleanup_expired_revoked_tokens
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    DELETE FROM revoked_tokens WHERE expires_at < NOW();
END//
DELIMITER ;

-- =============================================================================
-- End of Schema
-- =============================================================================
