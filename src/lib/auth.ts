import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const COOKIE_NAME = 'downfall_admin_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const AUTH_STORE_PATH = path.join(process.cwd(), 'src', 'data', 'auth-store.json');

interface AuthStore {
  rateLimits: Record<string, { attempts: number; lockedUntil: number }>;
  revokedTokens: string[];
}

function readAuthStore(): AuthStore {
  try {
    if (fs.existsSync(AUTH_STORE_PATH)) {
      const data = fs.readFileSync(AUTH_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return {
          rateLimits: parsed.rateLimits || {},
          revokedTokens: Array.isArray(parsed.revokedTokens) ? parsed.revokedTokens : [],
        };
      }
    }
  } catch {}
  return { rateLimits: {}, revokedTokens: [] };
}

function writeAuthStore(store: AuthStore) {
  try {
    const dir = path.dirname(AUTH_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(AUTH_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write auth store:', err);
  }
}

/**
 * Validates that production credentials and session secrets meet minimum complexity.
 */
function getAuthConfig() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();

  if (!username || !password || !secret) {
    throw new Error(
      'Server authentication configuration missing. ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET must be set in environment.'
    );
  }

  if (password.length < 16) {
    throw new Error('Insecure ADMIN_PASSWORD. Server requires a minimum of 16 characters.');
  }

  if (secret.length < 32) {
    throw new Error('Insecure ADMIN_SESSION_SECRET. Server requires a minimum of 32 characters for HMAC secret.');
  }

  return { username, password, secret };
}

/**
 * Checks if an IP or identifier is currently rate-limited.
 * When Supabase is configured, persists across all Netlify serverless instances.
 */
export async function checkLoginRateLimit(identifier: string): Promise<{ isLimited: boolean; remainingMs?: number }> {
  const now = Date.now();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .single();

      if (data) {
        const lockedUntil = Number(data.locked_until || 0);
        if (lockedUntil > now) {
          return { isLimited: true, remainingMs: lockedUntil - now };
        }
        if (lockedUntil > 0 && now > lockedUntil) {
          await supabase.from('auth_rate_limits').delete().eq('identifier', identifier);
        }
      }
      return { isLimited: false };
    }
  }

  // Local file-backed fallback
  const store = readAuthStore();
  const entry = store.rateLimits[identifier];
  if (!entry) return { isLimited: false };

  if (entry.lockedUntil > now) {
    return { isLimited: true, remainingMs: entry.lockedUntil - now };
  }

  if (entry.lockedUntil > 0 && now > entry.lockedUntil) {
    delete store.rateLimits[identifier];
    writeAuthStore(store);
  }

  return { isLimited: false };
}

/**
 * Records a failed login attempt.
 * Persists in Supabase PostgreSQL when configured.
 */
export async function recordFailedLogin(
  identifier: string
): Promise<{ locked: boolean; remainingAttempts: number; remainingMs?: number }> {
  const now = Date.now();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      // 1. Atomic PostgreSQL function call
      try {
        const { data, error } = await supabase.rpc('increment_auth_rate_limit', {
          p_identifier: identifier,
          p_max_attempts: MAX_FAILED_ATTEMPTS,
          p_lockout_window_ms: LOCKOUT_WINDOW_MS,
          p_now: now,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          const row = data[0];
          return {
            locked: Boolean(row.locked),
            remainingAttempts: Number(row.remaining_attempts),
            remainingMs: row.locked ? Number(row.remaining_ms) : undefined,
          };
        }
      } catch (rpcErr) {
        console.warn('RPC increment_auth_rate_limit error, using atomic query fallback:', rpcErr);
      }

      // Fallback query if RPC has not been migrated yet
      const { data } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .single();

      const currentAttempts = (data?.attempts || 0) + 1;

      if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = now + LOCKOUT_WINDOW_MS;
        await supabase.from('auth_rate_limits').upsert({
          identifier,
          attempts: currentAttempts,
          locked_until: lockedUntil,
          updated_at: new Date().toISOString(),
        });
        return { locked: true, remainingAttempts: 0, remainingMs: LOCKOUT_WINDOW_MS };
      }

      await supabase.from('auth_rate_limits').upsert({
        identifier,
        attempts: currentAttempts,
        locked_until: 0,
        updated_at: new Date().toISOString(),
      });
      return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - currentAttempts };
    }
  }

  // Local file-backed fallback (development/test only)
  const store = readAuthStore();
  const entry = store.rateLimits[identifier] || { attempts: 0, lockedUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_WINDOW_MS;
    store.rateLimits[identifier] = entry;
    writeAuthStore(store);
    return { locked: true, remainingAttempts: 0, remainingMs: LOCKOUT_WINDOW_MS };
  }

  store.rateLimits[identifier] = entry;
  writeAuthStore(store);
  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - entry.attempts };
}

/**
 * Resets rate limit counter on successful login.
 */
export async function resetLoginRateLimit(identifier: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from('auth_rate_limits').delete().eq('identifier', identifier);
      return;
    }
  }

  const store = readAuthStore();
  if (store.rateLimits[identifier]) {
    delete store.rateLimits[identifier];
    writeAuthStore(store);
  }
}

/**
 * Verifies explicit server-side authorization for an authenticated user.
 */
export async function verifyAdminAuthorization(userId?: string, email?: string): Promise<boolean> {
  // 1. Check configured ADMIN_EMAILS environment whitelist
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (email && adminEmails.includes(email.toLowerCase())) {
    return true;
  }

  // 2. Check Supabase admin_users table
  if (userId && isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data && data.role === 'admin') {
        return true;
      }
    }
  }

  return false;
}

/**
 * Timing-safe credential comparison for fallback login.
 */
export function verifyCredentials(inputUser: string, inputPass: string): boolean {
  if (!inputUser || !inputPass) return false;

  try {
    const config = getAuthConfig();

    const inputUserHash = crypto.createHash('sha256').update(inputUser.trim()).digest();
    const configUserHash = crypto.createHash('sha256').update(config.username).digest();

    const inputPassHash = crypto.createHash('sha256').update(inputPass).digest();
    const configPassHash = crypto.createHash('sha256').update(config.password).digest();

    const userMatch = crypto.timingSafeEqual(inputUserHash, configUserHash);
    const passMatch = crypto.timingSafeEqual(inputPassHash, configPassHash);

    return userMatch && passMatch;
  } catch (err) {
    console.error('Credential verification error:', err);
    return false;
  }
}

/**
 * Generates an HMAC-signed session token with a unique session ID (jti).
 */
export function createSessionToken(username: string): string {
  const config = getAuthConfig();
  const jti = crypto.randomUUID();
  const payload = {
    jti,
    u: username,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.secret)
    .update(payloadStr)
    .digest('base64url');
  return `${payloadStr}.${signature}`;
}

/**
 * Verifies the HMAC signature, expiration, and revocation status of a session token.
 */
export function verifySessionToken(token: string): { valid: boolean; username?: string; jti?: string } {
  if (!token || typeof token !== 'string') return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };

  try {
    const config = getAuthConfig();
    const [payloadStr, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', config.secret)
      .update(payloadStr)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return { valid: false };
    }

    // Check revocation store
    if (payload.jti) {
      const store = readAuthStore();
      if (store.revokedTokens.includes(payload.jti)) {
        return { valid: false };
      }
    }

    return { valid: true, username: payload.u, jti: payload.jti };
  } catch {
    return { valid: false };
  }
}

/**
 * Revokes a session token.
 */
export function revokeSessionToken(token: string) {
  const verification = verifySessionToken(token);
  if (verification.jti) {
    const store = readAuthStore();
    if (!store.revokedTokens.includes(verification.jti)) {
      store.revokedTokens.push(verification.jti);
      if (store.revokedTokens.length > 1000) {
        store.revokedTokens = store.revokedTokens.slice(-1000);
      }
      writeAuthStore(store);
    }
  }
}

/**
 * Retrieves and validates the current admin session.
 * Checks Supabase Auth session first (with explicit server authorization), then fallback cookie.
 */
export async function getAdminSession(): Promise<{ authenticated: boolean; username?: string; isSupabase?: boolean }> {
  // 1. Supabase Auth session check
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const isAuthorized = await verifyAdminAuthorization(user.id, user.email);
          if (isAuthorized) {
            return {
              authenticated: true,
              username: user.email || 'Admin',
              isSupabase: true,
            };
          }
        }
      }
    } catch (err) {
      // Supabase session check failure, proceed to fallback cookie
    }
  }

  // In production, fallback cookie sessions are strictly disabled!
  if (process.env.NODE_ENV === 'production') {
    return { authenticated: false };
  }

  // 2. Fallback HMAC cookie check (only available in development / local testing)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return { authenticated: false };
    const verification = verifySessionToken(token);
    return { authenticated: verification.valid, username: verification.username, isSupabase: false };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Enforces server session authentication and CSRF / origin protection
 * on state-changing administrative requests (POST, PUT, DELETE, PATCH).
 */
export async function verifyAdminRequest(request: Request): Promise<
  { authorized: true; username: string } | { authorized: false; error: string; status: number }
> {
  const session = await getAdminSession();
  if (!session.authenticated || !session.username) {
    return { authorized: false, error: 'Unauthorized. Valid server session required.', status: 401 };
  }

  // Cross-site request protection for mutations
  const method = request.method.toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');

    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (host && originHost !== host) {
          return { authorized: false, error: 'Cross-site request rejected (origin mismatch).', status: 403 };
        }
      } catch {
        return { authorized: false, error: 'Invalid origin header.', status: 403 };
      }
    } else if (referer) {
      try {
        const refererHost = new URL(referer).host;
        if (host && refererHost !== host) {
          return { authorized: false, error: 'Cross-site request rejected (referer mismatch).', status: 403 };
        }
      } catch {
        return { authorized: false, error: 'Invalid referer header.', status: 403 };
      }
    }
  }

  return { authorized: true, username: session.username };
}

export { COOKIE_NAME, SESSION_DURATION_MS };
