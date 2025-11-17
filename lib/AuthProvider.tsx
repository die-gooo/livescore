'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

type UserProfile = {
  id: string;
  display_name: string | null;
  role: 'viewer' | 'scorekeeper' | 'admin';
  team_id: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: User | null) => {
    if (!u) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, role, team_id')
      .eq('id', u.id)
      .single();

    if (error) {
      console.error('Error loading profile', error.message);
      setProfile(null);
    } else {
      setProfile(data as UserProfile);
    }

    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user ?? null;
      setUser(u);
      await loadProfile(u);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      await loadProfile(u);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
