import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHmac, createPublicKey, timingSafeEqual, verify as cryptoVerify, KeyObject } from 'crypto';
import * as https from 'https';

/**
 * Rate-limit key: the signed-in user when there is one, the client IP otherwise.
 *
 * Mobile carriers in most of Africa put thousands of subscribers behind one
 * carrier-grade NAT address, so a pure per-IP bucket throttles a whole network
 * the moment a few people use the app at once. Keying authenticated traffic on
 * the user id gives each person their own bucket; anonymous traffic keeps the
 * per-IP bucket (`req.ip` is the real client because main.ts sets `trust proxy`).
 *
 * This runs as the global APP_GUARD, i.e. BEFORE the route's JwtAuthGuard, so
 * `req.user` is not populated yet. The token is therefore verified here. It must
 * be verified, not just decoded: an unverified `sub` would let anyone mint a
 * fresh bucket per request with a made-up token and bypass throttling entirely.
 * Anything that fails verification (expired, forged, the Billie service token)
 * silently falls back to the IP key.
 */
@Injectable()
export class UserAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = await verifiedSubject(req.headers?.authorization);
    if (userId) return `user:${userId}`;
    return `ip:${req.ip ?? req.socket?.remoteAddress ?? 'unknown'}`;
  }
}

// ── Minimal Supabase JWT verification (HS256 legacy secret, ES256/RS256 JWKS) ──

const JWKS_TTL_MS = 10 * 60 * 1000;
// An unknown kid triggers a refetch (key rotation), but at most this often, so a
// stream of tokens with invented kids cannot turn into a stream of JWKS fetches.
const JWKS_MIN_REFETCH_MS = 60 * 1000;
const jwks: { keys: Map<string, KeyObject>; fetchedAt: number; inflight: Promise<void> | null } = {
  keys: new Map(),
  fetchedAt: 0,
  inflight: null,
};

function refreshJwks(): Promise<void> {
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  if (!base) return Promise.resolve();
  if (jwks.inflight) return jwks.inflight;
  jwks.inflight = new Promise<void>((resolve) => {
    const req = https.get(`${base}/auth/v1/.well-known/jwks.json`, { timeout: 5000 }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { keys?: any[] };
          const next = new Map<string, KeyObject>();
          for (const jwk of json.keys ?? []) {
            try {
              if (jwk.kid) next.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
            } catch {
              /* skip keys Node cannot import */
            }
          }
          jwks.keys = next;
        } catch {
          /* keep the previous keys */
        }
        resolve();
      });
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve());
  }).finally(() => {
    jwks.fetchedAt = Date.now();
    jwks.inflight = null;
  });
  return jwks.inflight;
}

async function keyFor(kid: string | undefined): Promise<KeyObject | null> {
  if (!kid) return null;
  const age = Date.now() - jwks.fetchedAt;
  if ((!jwks.keys.has(kid) && age > JWKS_MIN_REFETCH_MS) || age > JWKS_TTL_MS) {
    await refreshJwks();
  }
  return jwks.keys.get(kid) ?? null;
}

function decodePart(part: string): any {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

/**
 * The `sub` of a validly signed, unexpired Supabase access token, else null.
 * Also used where a public route wants to attach an optional identity.
 */
export async function verifiedSubject(authorization: unknown): Promise<string | null> {
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return null;
  const parts = authorization.slice(7).trim().split('.');
  if (parts.length !== 3) return null;

  try {
    const header = decodePart(parts[0]);
    const payload = decodePart(parts[1]);
    if (typeof payload?.sub !== 'string' || !payload.sub) return null;
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;

    const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
    const signature = Buffer.from(parts[2], 'base64url');

    if (header?.alg === 'HS256') {
      const secret = process.env.SUPABASE_JWT_SECRET;
      if (!secret) return null;
      const expected = createHmac('sha256', secret).update(signed).digest();
      return expected.length === signature.length && timingSafeEqual(expected, signature)
        ? payload.sub
        : null;
    }
    if (header?.alg === 'ES256' || header?.alg === 'RS256') {
      const key = await keyFor(header.kid);
      if (!key) return null;
      const ok = cryptoVerify(
        'sha256',
        signed,
        header.alg === 'ES256' ? { key, dsaEncoding: 'ieee-p1363' } : key,
        signature,
      );
      return ok ? payload.sub : null;
    }
    return null;
  } catch {
    return null;
  }
}
