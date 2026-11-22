-- Convert SHA-256 hashes written by earlier versions from base64url to hex.
UPDATE "sessions" SET "session_token_hash" = encode(decode(translate("session_token_hash", '-_', '+/') || '=', 'base64'), 'hex') WHERE "session_token_hash" ~ '^[A-Za-z0-9_-]{43}$';
UPDATE "login_challenges" SET "challenge_token_hash" = encode(decode(translate("challenge_token_hash", '-_', '+/') || '=', 'base64'), 'hex') WHERE "challenge_token_hash" ~ '^[A-Za-z0-9_-]{43}$';
UPDATE "recovery_codes" SET "code_hash" = encode(decode(translate("code_hash", '-_', '+/') || '=', 'base64'), 'hex') WHERE "code_hash" ~ '^[A-Za-z0-9_-]{43}$';
