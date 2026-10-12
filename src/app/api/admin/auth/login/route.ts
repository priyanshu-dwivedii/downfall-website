import { NextResponse } from 'next/server';
import {
  verifyCredentials,
  createSessionToken,
  COOKIE_NAME,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
  verifyAdminAuthorization,
} from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'client';

    const body = await request.json();
    const { username, password } = body;

    const rateLimitKey = `${clientIp}_${username || 'anon'}`;

    // 1. Check persistent rate limit across instances
    const rateCheck = await checkLoginRateLimit(rateLimitKey);
    if (rateCheck.isLimited) {
      const waitMinutes = Math.ceil((rateCheck.remainingMs || 0) / 60000);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Access temporarily locked for ${waitMinutes} minute${waitMinutes === 1 ? '' : 's'}.`,
        },
        { status: 429 }
      );
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // In production, Supabase cloud authentication is strictly required.
    // Local fallback login is disabled; missing cloud configuration must fail clearly.
    if (isProduction && !isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            'Production configuration error: Supabase cloud authentication is required in production. Fallback admin login is disabled. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 500 }
      );
    }

    // 2. Supabase Auth workflow if configured
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password,
        });

        if (!error && data.user) {
          // Explicit server-side authorization check
          const isAuthorized = await verifyAdminAuthorization(data.user.id, data.user.email);
          if (!isAuthorized) {
            await supabase.auth.signOut();
            return NextResponse.json(
              { error: 'Access denied. Account is not an authorized administrator.' },
              { status: 403 }
            );
          }

          // Reset rate limit on success
          await resetLoginRateLimit(rateLimitKey);
          return NextResponse.json({
            success: true,
            message: 'Authenticated successfully with Supabase Auth',
          });
        }

        // In production, never fall back to local credentials on failed Supabase auth
        if (isProduction) {
          const result = await recordFailedLogin(rateLimitKey);
          if (result.locked) {
            return NextResponse.json(
              {
                error: 'Too many failed login attempts. Access temporarily locked for 15 minutes.',
              },
              { status: 429 }
            );
          }
          return NextResponse.json(
            {
              error: `Invalid cloud credentials. Access denied. (${result.remainingAttempts} attempt${result.remainingAttempts === 1 ? '' : 's'} remaining)`,
            },
            { status: 401 }
          );
        }
      }
    }

    // 3. Fallback verification (strictly disabled in production)
    if (isProduction) {
      return NextResponse.json(
        { error: 'Fallback admin login is disabled in production.' },
        { status: 403 }
      );
    }

    const isValid = verifyCredentials(username, password);
    if (!isValid) {
      const result = await recordFailedLogin(rateLimitKey);
      if (result.locked) {
        return NextResponse.json(
          {
            error: 'Too many failed login attempts. Access temporarily locked for 15 minutes.',
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          error: `Invalid credentials. Access denied. (${result.remainingAttempts} attempt${result.remainingAttempts === 1 ? '' : 's'} remaining)`,
        },
        { status: 401 }
      );
    }

    // 4. Reset rate limit on success
    await resetLoginRateLimit(rateLimitKey);

    // 5. Issue authenticated session token
    const token = createSessionToken(username);
    const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
