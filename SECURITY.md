# Security Checklist

## Authentication & Sessions
- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT-based sessions with NextAuth
- [x] Protected routes via middleware
- [x] OAuth-ready structure (Google, GitHub)
- [ ] Rate limiting on `/api/auth/register` (add express-rate-limit or similar)
- [ ] Account lockout after N failed login attempts

## Input Validation
- [x] Zod schema validation on all API endpoints
- [x] Type-safe request handling
- [ ] Content-Security-Policy headers
- [ ] Input sanitization for XSS (markdown rendering)

## API Security
- [ ] Rate limiting on `/api/chat/stream` (per-user token bucket)
- [x] Auth check on all API routes
- [x] User ownership verification (conversations, messages, memory)
- [ ] CORS configuration for production

## Session Security
- [x] HTTP-only cookies (via NextAuth)
- [x] Secure cookie flag in production
- [x] CSRF protection (via NextAuth)
- [ ] Session rotation on privilege change

## Data Protection
- [x] User data isolation (multi-tenant queries)
- [x] Cascade deletes for user data cleanup
- [ ] Encryption at rest for sensitive data
- [ ] PII handling policy

## File Upload Security
- [ ] File type validation (mime + magic bytes)
- [ ] Max file size enforcement
- [ ] Virus scanning for uploaded files
- [ ] Secure file storage (S3 or dedicated service)

## Infrastructure
- [ ] HTTPS enforcement
- [ ] Environment variables never exposed to client
- [x] `.env.example` without secrets
- [ ] Docker container security hardening
- [ ] Database connection pooling (pgBouncer)

## Monitoring
- [ ] Audit logging for admin actions
- [ ] Error monitoring (Sentry or similar)
- [ ] Rate limit violation alerts
