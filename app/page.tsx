'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthProvider';
import { supabase } from '../lib/supabaseClient';

type Match = {
  id: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  home_score: number;
  away_score: number;
  start_time: string;
  home_team: { name: string };
  away_team: { name: string };
};

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('matches')
      .select(
        `
        id,
        status,
        home_score,
        away_score,
        start_time,
        home_team:home_team_id ( name ),
        away_team:away_team_id ( name )
      `
      )
      .order('start_time', { ascending: true });

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setMatches(data as Match[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadMatches();
  }, []);

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <p>Carico le partite...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <p>Errore: {error}</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 32,
        fontFamily: 'system-ui, sans-serif',
        background: '#f5f5f5',
      }}
    >
      {/* HEADER CON LOGIN / LOGOUT */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <strong>Livescore</strong>
        </div>

        <div style={{ fontSize: 14 }}>
          {authLoading ? (
            <span>Verifica login...</span>
          ) : user ? (
            <>
              <span style={{ marginRight: 8 }}>{user.email}</span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => (window.location.href = '/login')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: 'white',
                  marginRight: 8,
                  cursor: 'pointer',
                }}
              >
                Login
              </button>
              <button
                onClick={() => (window.location.href = '/signup')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Signup
              </button>
            </>
          )}
        </div>
      </header>

      {/* TITOLO + LISTA PARTITE */}
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Livescore – Partite</h1>

      {matches.length === 0 && <p>Nessuna partita trovata.</p>}

      {matches.map((m) => (
        <a
          key={m.id}
          href={`/match/${m.id}`}
          style={{
            display: 'block',
            background: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          {/* Riga superiore: status + data/ora */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 999,
                background:
                  m.status === 'LIVE'
                    ? 'rgba(220,38,38,0.1)'
                    : 'rgba(148,163,184,0.2)',
                color: m.status === 'LIVE' ? '#b91c1c' : '#475569',
              }}
            >
              {m.status}
            </span>

            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {new Date(m.start_time).toLocaleString()}
            </span>
          </div>

          {/* Riga centrale: squadre + punteggio + badge GOAL per chi ha segnato */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* HOME TEAM + badge GOAL se home_score > 0 */}
            <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>
              <div
                style={{
                  fontSize: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{m.home_team?.name}</span>
                {m.home_score > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 999,
                      background: 'rgba(220,38,38,0.15)',
                      color: '#b91c1c',
                      fontWeight: 700,
                    }}
                  >
                    GOAL
                  </span>
                )}
              </div>
            </div>

            {/* SCORE */}
            <div
              style={{
                minWidth: 80,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {m.home_score} - {m.away_score}
            </div>

            {/* AWAY TEAM + badge GOAL se away_score > 0 */}
            <div style={{ flex: 1, textAlign: 'left', paddingLeft: 8 }}>
              <div
                style={{
                  fontSize: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{m.away_team?.name}</span>
                {m.away_score > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 999,
                      background: 'rgba(220,38,38,0.15)',
                      color: '#b91c1c',
                      fontWeight: 700,
                    }}
                  >
                    GOAL
                  </span>
                )}
              </div>
            </div>
          </div>
        </a>
      ))}
    </main>
  );
}
