'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui',
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: 320,
          padding: 24,
          borderRadius: 12,
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 16 }}>Login</h1>

        {error && (
          <p style={{ color: 'red', marginBottom: 8, fontSize: 14 }}>{error}</p>
        )}

        <label style={{ display: 'block', marginBottom: 8 }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: 'none',
            background: '#2563eb',
            color: 'white',
            fontWeight: 600,
          }}
        >
          {loading ? 'Accesso...' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/signup')}
          style={{
            marginTop: 12,
            width: '100%',
            padding: 8,
            borderRadius: 8,
            border: '1px solid #ccc',
            background: 'white',
          }}
        >
          Non hai un account? Registrati
        </button>
      </form>
    </main>
  );
}
