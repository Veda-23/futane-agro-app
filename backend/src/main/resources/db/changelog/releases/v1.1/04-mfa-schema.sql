--liquibase formatted sql
--changeset futaneagro:04-mfa-schema splitStatements:true endDelimiter:;

-- 1. Add MFA columns to t_core_user
ALTER TABLE t_core_user ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE t_core_user ADD COLUMN IF NOT EXISTS mfa_factor VARCHAR(32) DEFAULT NULL;
ALTER TABLE t_core_user ADD COLUMN IF NOT EXISTS mfa_phone_e164 VARCHAR(20) DEFAULT NULL;

-- 2. Create recovery codes table for MFA fallback
CREATE TABLE IF NOT EXISTS t_user_mfa_recovery_codes (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL REFERENCES t_core_user(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_recovery_lookup ON t_user_mfa_recovery_codes(user_id, used);

-- 3. Create used tokens table for replay attack mitigation
CREATE TABLE IF NOT EXISTS t_mfa_used_tokens (
    id CHAR(36) PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id CHAR(36) NULL REFERENCES t_core_user(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mfa_used_tokens_hash ON t_mfa_used_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_mfa_used_tokens_expiry ON t_mfa_used_tokens(expires_at);
