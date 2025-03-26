import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, getConnectionStatus, clearAuthData } from '../lib/supabase';

interface Profile {
  id: string;
  role: 'student' | 'teacher' | 'admin';
  full_name: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isOnline: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: AuthError | Error }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check connection status periodically
    const connectionInterval = setInterval(() => {
      setIsOnline(getConnectionStatus());
    }, 5000);

    // Check active sessions and subscribe to auth changes
    const initializeAuth = async () => {
      try {
        // Always attempt to get session initially
        const { data: { session } } = await supabase.auth.getSession();
        
        // Set user state based on session
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          // No active session, so we're done loading
          setLoading(false);
        }

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadProfile(session.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
          clearInterval(connectionInterval);
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
        return () => clearInterval(connectionInterval);
      }
    };

    const cleanup = initializeAuth();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
      clearInterval(connectionInterval);
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      // Get user metadata from the current user object
      const userMetadata = user?.user_metadata;
      
      // Store the full name in localStorage as a backup
      if (userMetadata?.full_name) {
        localStorage.setItem('user_full_name', userMetadata.full_name);
      }
      
      // Create a default profile based on user metadata
      const defaultProfile: Profile = {
        id: userId,
        role: (userMetadata?.role as any) || 'student',
        full_name: userMetadata?.full_name || localStorage.getItem('user_full_name') || 'Пользователь',
      };
      
      // Try to load the profile from the database
      try {
        // Use id filter instead of email
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId);

        if (error) {
          console.warn('Using default profile due to error:', error);
          setProfile(defaultProfile);
        } else if (data && data.length > 0) {
          // Store the profile name in localStorage as a backup
          localStorage.setItem('user_full_name', data[0].full_name);
          setProfile(data[0]);
        } else {
          console.warn('No profile found, creating one');
          
          // Try to create a profile if it doesn't exist
          try {
            // First check if profile already exists to avoid duplicate key error
            const { count, error: countError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('id', userId);
              
            if (countError) {
              console.warn('Error checking profile existence:', countError);
              setProfile(defaultProfile);
              setLoading(false);
              return;
            }
            
            // Only insert if profile doesn't exist
            if (count === 0) {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert([defaultProfile]);
                
              if (insertError) {
                console.warn('Error creating profile:', insertError);
              } else {
                // Profile created successfully
                console.log('Profile created successfully');
              }
            } else {
              console.log('Profile already exists, skipping creation');
            }
            
            setProfile(defaultProfile);
          } catch (insertErr) {
            console.warn('Exception creating profile:', insertErr);
            setProfile(defaultProfile);
          }
        }
      } catch (err) {
        console.warn('Exception loading profile, using default:', err);
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error in loadProfile function:', error);
      // If all else fails, create a minimal profile
      setProfile({
        id: userId,
        role: 'student',
        full_name: localStorage.getItem('user_full_name') || 'Пользователь',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error };
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...data } : null);
      
      // Update localStorage backup
      if (data.full_name) {
        localStorage.setItem('user_full_name', data.full_name);
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating profile:', error);
      return { success: false, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      // First check if we're online
      if (!getConnectionStatus()) {
        return { 
          error: new Error('Нет подключения к серверу. Проверьте интернет-соединение и попробуйте снова.') 
        };
      }

      // Attempt to sign in
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('Sign in error:', error);
          return { error };
        }
        
        // Store user metadata in localStorage as backup
        if (data?.user?.user_metadata?.full_name) {
          localStorage.setItem('user_full_name', data.user.user_metadata.full_name);
        }
        
        return { data };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        console.error('Sign in exception:', err);
        return { error };
      }
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { 
        error: error instanceof Error ? error : new Error('Неизвестная ошибка. Попробуйте позже.') 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // First clear local state
      setProfile(null);
      
      // Clear all auth data from localStorage
      clearAuthData();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error from Supabase:', error);
        throw error;
      }
      
      // Force clear the user state
      setUser(null);
      
      // Return successfully
      return;
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, we should still clear the local state
      setUser(null);
      setProfile(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isOnline, 
      signIn, 
      signOut,
      updateProfile 
    }}>
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