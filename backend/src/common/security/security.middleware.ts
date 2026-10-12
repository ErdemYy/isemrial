import { Injectable, NestMiddleware, ForbiddenException, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store (keyed by IP + bucket)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isProduction = process.env.NODE_ENV === "production";
    const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

    const allowedOrigins = isProduction
      ? [frontendOrigin]
      : [frontendOrigin, "http://localhost:3000", "http://127.0.0.1:3000"];

    // ==========================================
    // 1. HTTP Security Headers (SEC-03)
    // ==========================================
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (isProduction) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
    }

    // ==========================================
    // 2. CSRF & Origin Validation (SEC-04)
    // ==========================================
    // For state-changing methods (POST, PUT, PATCH, DELETE)
    const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    if (isStateChanging) {
      // Fetch metadata check: reject if browser explicitly flags request as cross-site
      const secFetchSite = (req.headers["sec-fetch-site"] as string | undefined)?.toLowerCase();
      if (secFetchSite === "cross-site") {
        throw new ForbiddenException(
          "CSRF Koruması: Çapraz site isteği engellendi (sec-fetch-site: cross-site).",
        );
      }

      const originHeader = req.headers["origin"] as string | undefined;
      const refererHeader = req.headers["referer"] as string | undefined;

      let requestOrigin = originHeader;
      if (!requestOrigin && refererHeader) {
        try {
          const parsed = new URL(refererHeader);
          requestOrigin = `${parsed.protocol}//${parsed.host}`;
        } catch {
          // Invalid referer URL format
        }
      }

      // Check explicit Origin or Referer if present
      if (requestOrigin) {
        // Reject null origins (sandboxed iframe / opaque origins)
        if (requestOrigin.toLowerCase() === "null") {
          throw new ForbiddenException("CSRF Koruması: 'null' kaynaklı istek reddedildi.");
        }

        const isAllowed = allowedOrigins.some(
          (allowed) => allowed.toLowerCase() === requestOrigin!.toLowerCase(),
        );

        if (!isAllowed) {
          throw new ForbiddenException(
            `CSRF Koruması: Geçersiz veya yetkisiz istek kaynağı (${requestOrigin}).`,
          );
        }
      }
    }

    // ==========================================
    // 3. Rate Limiting (SEC-02 / FAZ 5.1 Hardening)
    // ==========================================
    // Only trust X-Forwarded-For if TRUST_PROXY is explicitly enabled (prevents client spoofing)
    const trustProxy = process.env.TRUST_PROXY === "true";
    let clientIp: string;
    if (trustProxy && req.headers["x-forwarded-for"]) {
      clientIp = (req.headers["x-forwarded-for"] as string).split(",")[0].trim();
    } else {
      clientIp = req.ip || req.socket.remoteAddress || "unknown-ip";
    }

    const fullPath = (req.originalUrl || req.url || req.path || "").toLowerCase();
    const isLoginEndpoint = fullPath.includes("/auth/login");
    const isRegisterEndpoint = fullPath.includes("/auth/register");

    // Limits: Login -> 10 req/min, Register -> 10 req/min, General API -> 120 req/min
    let maxRequests = 120;
    let bucketType = "api";
    if (isLoginEndpoint) {
      maxRequests = 10;
      bucketType = "auth:login";
    } else if (isRegisterEndpoint) {
      maxRequests = 10;
      bucketType = "auth:register";
    }

    const windowMs = 60 * 1000; // 1 minute window
    const bucketKey = `${clientIp}:${bucketType}`;

    const now = Date.now();
    let record = rateLimitStore.get(bucketKey);

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(bucketKey, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetSeconds.toString());

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", resetSeconds.toString());
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: "TooManyRequests",
          message: "Çok fazla istek gönderildi. Lütfen bir süre sonra tekrar deneyiniz.",
          retryAfter: resetSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}

