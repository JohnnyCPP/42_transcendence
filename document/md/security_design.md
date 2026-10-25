## Security Design

- Session cookies are `HttpOnly`, `SameSite=Lax`, and can be marked `Secure` through configuration.
- Only token hashes are stored for sessions, login challenges, and recovery codes.
- Password verification uses timing-safe comparison.
- TOTP secrets are encrypted with AES-256-GCM.
- Login, registration, second-factor, and reauthentication attempts use in-memory rate limits.
- Login challenges and recovery codes are consumed conditionally to prevent concurrent reuse.
- Permission checks are applied in the service layer before data access or mutation.
- Error responses use a consistent `{ error, message }` structure.

The rate limiter is process-local and is not currently shared between multiple backend instances. Production deployment also still requires HTTPS termination, centralized secret management, and the security infrastructure selected by the team.

