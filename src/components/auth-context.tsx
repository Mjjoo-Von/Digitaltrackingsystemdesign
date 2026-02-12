import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  studentId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, studentId: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a singleton Supabase client instance
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        setAccessToken(session.access_token);
        
        // Fetch user profile from backend
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/me`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error during sign in:', error);
        throw error;
      }

      if (data.session?.access_token) {
        setAccessToken(data.session.access_token);
        
        // Fetch user profile
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/me`,
            {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`,
              },
            }
          );

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            const errorText = await response.text();
            console.error('Error fetching user profile:', errorText);
            // Still set basic user info even if profile fetch fails
            setUser({
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || '',
              role: data.user.user_metadata?.role || 'student',
              studentId: data.user.user_metadata?.studentId
            });
          }
        } catch (fetchError) {
          console.error('Network error fetching user profile:', fetchError);
          // Still set basic user info even if profile fetch fails
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || '',
            role: data.user.user_metadata?.role || 'student',
            studentId: data.user.user_metadata?.studentId
          });
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, name: string, studentId: string, role: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name, studentId, role }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sign up');
      }

      // Sign in after successful signup
      await signIn(email, password);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}