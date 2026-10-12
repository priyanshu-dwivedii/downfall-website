'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../admin.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Success: redirect to admin dashboard
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginBrand}>DOWNFALL</h1>
          <p className={styles.loginSubtitle}>Atelier Client Administration</p>
        </div>

        {error && (
          <div className={styles.loginError} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {(() => {
            const isSupabaseActive = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
            return (
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel} htmlFor="admin-identifier">
                  {isSupabaseActive ? 'Email' : 'Username'}
                </label>
                <input
                  id="admin-identifier"
                  type={isSupabaseActive ? 'email' : 'text'}
                  required
                  autoFocus
                  className={styles.fieldInput}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isSupabaseActive ? 'admin@downfall.in' : 'e.g. admin'}
                  autoComplete={isSupabaseActive ? 'email' : 'username'}
                />
              </div>
            );
          })()}

          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              className={styles.fieldInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={styles.loginSubmitBtn}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Enter Atelier Dashboard'}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <Link href="/" className={styles.loginBackLink}>
            ← Return to DOWNFALL Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
