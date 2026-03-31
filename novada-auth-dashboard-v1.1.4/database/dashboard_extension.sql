-- =============================================================================
-- Novada Dashboard - Optional Persistence Extension
-- =============================================================================
-- These tables are optional. The shipped dashboard currently uses in-memory demo
-- data for proxy users and whitelist records. Apply this file when you are ready
-- to persist dashboard state in MySQL and expose matching CRUD APIs.

CREATE TABLE IF NOT EXISTS proxy_users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_user_id BIGINT UNSIGNED NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    note VARCHAR(255) DEFAULT NULL,
    traffic_limit_gb DECIMAL(10,2) DEFAULT NULL,
    traffic_used_gb DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_proxy_users_owner_username (owner_user_id, username),
    KEY idx_proxy_users_owner (owner_user_id),
    CONSTRAINT fk_proxy_users_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS whitelisted_ips (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_user_id BIGINT UNSIGNED NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    note VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_whitelisted_ips_owner_ip (owner_user_id, ip_address),
    KEY idx_whitelisted_ips_owner (owner_user_id),
    CONSTRAINT fk_whitelisted_ips_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
