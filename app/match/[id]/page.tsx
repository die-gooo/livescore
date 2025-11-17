'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/AuthProvider';

type MatchDetail = {
  id: string;
  status: 'SCHEDULED' | 'LIVE' | 'HALF_TIME' | 'FINISHED';
  home_score: number;
  away_score: number;
  start_time: string;
  home_team_id: string;
  away_team_id: string;
  home_team: { name: string };
  away_team: { name: string };
};

export default function MatchPage() {
  const params = useParams();
  const id = (params as any)?.id as string | undefined;
  const { profile } = useAuth();

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const loadMatch = async (matchId: string) => {
    setLoading(true);
    setLastError(null);

    try {
      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          id,
          status,
          home_score,
          away_score,
          start_time,
          home_team_id,
          away_team_id,
          home_team:home_team_id ( name ),
          away_team:away_team_id ( name )
        `
        )
        .eq('id', matchId)
        .single();

      if (error || !data) {
        console.error('loadMatch error', error);
        setMatch(null);
        setLastError(error?.message ?? 'Partita non trovata');
      } else {
        const normalized: MatchDetail = {
          id: data.id,
          status: data.status,
          home_score: data.home_score,
          away_score: data.away_score,
          start_time: data.start_time,
          home_team_id: data.home_team_id,
          away_team_id: data.away_team_id,
          home_team: Array.isArray(data.home_team)
            ? data.home_team[0]
            : data.home_team,
          away_team: Array.isArray(data.away_team)
            ? data.away_team[0]
            : data.away_team,
        };
        setMatch(normalized);
      }
    } catch (err: any) {
      console.error('loadMatch exception', err);
      setMatch(null);
      setLastError(err?.message ?? 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadMatch(id);
  }, [id]);

  const canEdit =
    !!match &&
    !!profile &&
    (profile.role === 'admin' ||
      (profile.role === 'scorekeeper' &&
        (profile.team_id === match.home_team_id ||
          profile.team_id === match.away_team_id)));

  const addGoal = async (team: 'home' | 'away') => {
    if (!match || !canEdit) {
      setLastError('Non hai i permessi per modificare questa partita.');
      return;
    }

    setUpdating(true);
    setLastError(null);

    const field = team === 'home' ? 'home_score' : 'away_score';
    const newScore = match[field] + 1;

    const { error } = await supabase
      .from('matches')
      .update({ [field]: newScore })
      .eq('id', match.id);

    if (error) {
      console.error('addGoal error', error);
      setLastError(error.message);
    } else {
      await loadMatch(match.id);
    }

    setUpdating(false);
  };

  const updateStatus = async (newStatus: MatchDetail['status']) => {
    if (!match || !canEdit) {
      setLastError('Non hai i permessi per modificare questa partita.');
      return;
    }

    setUpdating(true);
    setLastError(null);

    const { error } = await supabase
      .from('matches')
      .update({ status: newStatus })
      .eq('id', match.id);

    if (error) {
      console.error('updateStatus error', error);
      setLastError(error.message);
    } else {
      await loadMatch(match.id);
    }

    setUpdating(false);
  };

  const getStatusLabel = (status: MatchDetail['status']) => {
    switch (status) {
      case 'LIVE':
        return 'LIVE';
      case 'HALF_TIME':
        return 'HT';
      case 'FINISHED':
        return 'FT';
      case 'SCHEDULED':
      default:
        return 'SCHEDULED';
    }
  };

  // 🔹 1) Caso: nessun id → errore chiaro, NON spinner infinito
  if (!id) {
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
        <p>Nessun ID partita trovato.</p>
      </main>
    );
  }

  // 🔹 2) Caso: loading vero → spinner
  if (loading) {
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
        <p>Carico partita...</p>
      </main>
    );
  }

  // 🔹 3) Caso: loading finito ma match nullo → errore leggibile, NON spinner
  if (!match) {
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
        <div>
          <p>Partita non trovata.</p>
          {lastError && (
            <p style={{ marginTop: 8, color: '#b91c1c' }}>Errore: {lastError}</p>
          )}
        </div>
      </main>
    );
  }

  const debugProfileRole = profile?.role ?? 'null';
  const debugProfileTeamId = profile?.team_id ?? 'null';

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 32,
        fontFamily: 'system-ui',
        background: '#f5f5f5',
      }}
    >
      <button
        type="button"
        onClick={() => window.history.back()}
        style={{
          display: 'inline-block',
          marginBottom: 16,
          padding: '6px 10px',
          borderRadius: 999,
          border: '1px solid #ddd',
          background: 'white',
          fontSize: 13,
        }}
      >
        ← Indietro
      </button>

      <section
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: 24,
          borderRadius: 16,
          background: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            {match.home_team.name} – {match.away_team.name}
          </h1>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid #e5e7eb',
              fontSize: 12,
              background:
                match.status === 'LIVE'
                  ? '#fee2e2'
                  : match.status === 'FINISHED'
                  ? '#e5e7eb'
                  : 'white',
            }}
          >
            {getStatusLabel(match.status)}
          </span>
        </header>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>{match.home_team.name}</span>
          </div>

          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {match.home_score} – {match.away_score}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>{match.away_team.name}</span>
          </div>
        </div>

        {canEdit && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              disabled={updating}
              onClick={() => addGoal('home')}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: '#22c55e',
                color: 'white',
                fontSize: 13,
                cursor: updating ? 'default' : 'pointer',
              }}
            >
              +1 {match.home_team.name}
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => addGoal('away')}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: '#22c55e',
                color: 'white',
                fontSize: 13,
                cursor: updating ? 'default' : 'pointer',
              }}
            >
              +1 {match.away_team.name}
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() => updateStatus('LIVE')}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontSize: 13,
                cursor: updating ? 'default' : 'pointer',
              }}
            >
              LIVE
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => updateStatus('HALF_TIME')}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: '#f97316',
                color: 'white',
                fontSize: 13,
                cursor: updating ? 'default' : 'pointer',
              }}
            >
              HT
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => updateStatus('FINISHED')}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: '#6b7280',
                color: 'white',
                fontSize: 13,
                cursor: updating ? 'default' : 'pointer',
              }}
            >
              FT
            </button>
          </div>
        )}

        {lastError && (
          <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 13 }}>
            Errore: {lastError}
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            paddingTop: 12,
            borderTop: '1px dashed #e5e7eb',
            fontSize: 11,
            color: '#9ca3af',
          }}
        >
          <div>profile.role: {debugProfileRole}</div>
          <div>profile.team_id: {debugProfileTeamId}</div>
          <div>match.home_team_id: {match.home_team_id}</div>
          <div>match.away_team_id: {match.away_team_id}</div>
          <div>canEdit: {canEdit ? 'true' : 'false'}</div>
        </div>
      </section>
    </main>
  );
}
