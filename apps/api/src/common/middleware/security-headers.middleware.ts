import { Request, Response, NextFunction } from 'express';

/**
 * Hand-written stand-in for `helmet` (not installed, and the disk budget rules
 * out new dependencies). Sets the handful of headers that matter for a JSON API
 * served behind Render's TLS terminator.
 *
 * Deliberately NO Content-Security-Policy beyond `frame-ancestors`: the API also
 * serves HTML (embed widgets, inline document previews, generated report HTML)
 * that carries its own inline styles and scripts, and a strict CSP here would
 * break them. The web app's real CSP lives in `public/_headers` (Cloudflare).
 *
 * CORS is untouched — `app.enableCors()` sets its own headers independently.
 */

// Paths that third-party sites (and the web app's own <object>/<iframe>
// previews) are meant to frame. Everything else refuses to be framed.
const FRAMEABLE = [
  /^\/api\/embed(\/|$)/,
  /^\/api\/documents\/[^/]+\/download/,
  /^\/api\/insight-reports\/[^/]+\/download/,
];

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Browsers ignore HSTS over plain http, so this is harmless on localhost and
  // effective in production where Render terminates TLS.
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.removeHeader('X-Powered-By');

  const path = (req.originalUrl || req.url || '').split('?')[0];
  if (FRAMEABLE.some((re) => re.test(path))) {
    // Embeds must stay embeddable anywhere; X-Frame-Options has no "allow all"
    // value, so it is simply omitted here.
    res.setHeader('Content-Security-Policy', 'frame-ancestors *');
  } else {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  }
  next();
}
