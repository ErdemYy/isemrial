# Security Policy

## Supported Versions

| Version | Supported          |
| :---    | :---:              |
| Latest (`master`) | :white_check_mark: |
| < 0.1.0 | :x:                |

---

## Reporting a Vulnerability

We take the security and data privacy of İşEmriAl workshops seriously.

If you discover a security vulnerability or sensitive information exposure:

1. **Do NOT open a public GitHub issue.**
2. Report the vulnerability privately via **GitHub Security Advisories**:
   [Report a vulnerability on GitHub](https://github.com/ErdemYy/isemrial/security/advisories/new)
3. Please provide:
   - A description of the vulnerability.
   - Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
   - The potential impact on multi-tenant data isolation or authentication.

We will review reports promptly and collaborate on a secure resolution.

---

## Security Best Practices for Self-Hosting

When running İşEmriAl in staging or production:
- **HTTPS & Reverse Proxy:** Always terminate TLS (HTTPS) with a reverse proxy (e.g. Nginx, Caddy, Traefik, or AWS ALB) in front of the web container.
- **Strong Session Secret:** Generate a random cryptographically secure key of at least 32 bytes (`openssl rand -hex 32`) for `SESSION_SECRET`.
- **Database Isolation:** Never expose PostgreSQL port 5432 to the public internet. Use internal Docker network or VPC peering.
- **Demo Logins:** Always set `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false` in production environments.
