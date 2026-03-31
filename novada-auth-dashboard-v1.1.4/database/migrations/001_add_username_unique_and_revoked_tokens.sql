-- =============================================================================
-- Migration: 001_add_username_unique_and_revoked_tokens
-- Purpose: Upgrade an existing 1.0.0 database to the 1.1.0 auth/session model
-- =============================================================================

-- Add unique key only if it does not already exist
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uk_users_username');
SET @sql = IF(@exists = 0, 'ALTER TABLE users ADD UNIQUE KEY uk_users_username (username)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS revoked_tokens (
    token_hash CHAR(64) NOT NULL COMMENT 'SHA-256 hash of token jti (or token fallback)',
    token_type ENUM('access', 'refresh') NOT NULL DEFAULT 'access' COMMENT 'Revoked token category',
    expires_at TIMESTAMP NOT NULL COMMENT 'Original token expiry time',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Revocation timestamp',

    PRIMARY KEY (token_hash),
    KEY idx_revoked_tokens_expires_at (expires_at),
    KEY idx_revoked_tokens_type (token_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
