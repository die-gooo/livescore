'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const { id } = useParams();
  const { profile } = useAuth();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const loadMatch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLastError(null);

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
      .eq('id', id)
      .single();

    if (error) {
      console.error('loadMatch error', error);
      setLastError(error.message);
    }

    setMatch(data as MatchDetail | null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadMatch();

    const channel = supabase
      .channel(`match_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setMatch(payload.new as MatchDetail);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadMatch]);

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
    }

    setUpdating(false);
  };

  const updateStatus = async (newStatus: 'LIVE' | 'HALF_TIME' | 'FINISHED') => {
    if (!match || !canEdit) {
      setLastError('Non hai i permessi per modificare lo stato.');
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

  if (loading || !match) {
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
          color: '#2563eb',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ← Torna alla lista
      </button>

      <h1 style={{ fontSize: 26, marginBottom: 16 }}>
        {match.home_team?.name} vs {match.away_team?.name}
      </h1>

      <div
        style={{
          background: 'white',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>
          {match.home_score} - {match.away_score}
        </div>

        <p
          style={{
            textAlign: 'center',
            color: '#475569',
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          {getStatusLabel(match.status)} –{' '}
          {new Date(match.start_time).toLocaleString()}
        </p>
      </div>

      {canEdit ? (
        <>
          {/* Bottoni GOAL */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => addGoal('home')}
              disabled={updating}
              style={{
                flex: 1,
                padding: 12,
                background: '#dc2626',
                color: 'white',
                borderRadius: 8,
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: updating ? 0.7 : 1,
              }}
            >
              +1 Goal {match.home_team?.name}
            </button>

            <button
              onClick={() => addGoal('away')}
              disabled={updating}
              style={{
                flex: 1,
                padding: 12,
                background: '#2563eb',
                color: 'white',
                borderRadius: 8,
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: updating ? 0.7 : 1,
              }}
            >
              +1 Goal {match.away_team?.name}
            </button>
          </div>

          {/* Bottoni STATO: LIVE / HT / FT */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 4,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => updateStatus('LIVE')}
              disabled={updating || match.status === 'LIVE'}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #e5e7eb',
                background:
                  match.status === 'LIVE' ? 'rgba(22,163,74,0.1)' : 'white',
                color: match.status === 'LIVE' ? '#16a34a' : '#374151',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              LIVE
            </button>

            <button
              onClick={() => updateStatus('HALF_TIME')}
              disabled={updating || match.status === 'HALF_TIME'}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #e5e7eb',
                background:
                  match.status === 'HALF_TIME'
                    ? 'rgba(234,179,8,0.1)'
                    : 'white',
                color: match.status === 'HALF_TIME' ? '#ca8a04' : '#374151',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              HT
            </button>

            <button
              onClick={() => updateStatus('FINISHED')}
              disabled={updating || match.status === 'FINISHED'}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #e5e7eb',
                background:
                  match.status === 'FINISHED'
                    ? 'rgba(148,163,184,0.2)'
                    : 'white',
                color: match.status === 'FINISHED' ? '#4b5563' : '#374151',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              FT
            </button>
          </div>
        </>
      ) : (
        <p style={{ marginTop: 8, color: '#6b7280' }}>
          Solo il responsabile delle squadre coinvolte può aggiornare il
          punteggio o lo stato della partita.
        </p>
      )}

      {/* DEBUG BOX */}
      <div
        style={{
          marginTop: 24,
          fontSize: 12,
          color: '#6b7280',
          background: '#e5e7eb',
          padding: 12,
          borderRadius: 8,
        }}
      >
        <div>
          <strong>DEBUG</strong>
        </div>
        <div>profile.role: {debugProfileRole}</div>
        <div>profile.team_id: {debugProfileTeamId}</div>
        <div>match.home_team_id: {match.home_team_id}</div>
        <div>match.away_team_id: {match.away_team_id}</div>
        <div>canEdit: {canEdit ? 'true' : 'false'}</div>
        {lastError && (
          <div style={{ color: '#b91c1c', marginTop: 8 }}>
            lastError: {lastError}
          </div>
        )}
      </div>
    </main>
  );
}
