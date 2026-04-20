import { projectId, publicAnonKey } from './supabase/info';
import { getSupabaseClient } from './supabase/client';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e128d165`;

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'driver' | 'admin';
}

export interface AuthResponse {
  user: User;
}

export const auth = {
  /**
   * Sign up a new user
   * Creates account via server and then signs in using Supabase client
   */
  async signUp(email: string, password: string, name: string, role: 'user' | 'driver' | 'admin'): Promise<AuthResponse> {
    // Create user via server (for user metadata and KV store)
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, password, name, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign up');
    }

    const data = await response.json();

    // Now sign in using Supabase client to establish a managed session
    const supabase = getSupabaseClient();
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !sessionData.session) {
      console.error('Failed to establish Supabase session after signup:', signInError);
      throw new Error('Account created but failed to sign in. Please try logging in.');
    }

    console.log('[Auth] Signup successful, Supabase session established');

    return {
      user: data.user
    };
  },

  /**
   * Sign in using Supabase client
   * Uses Supabase session metadata directly, with server profile as optional enrichment
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const supabase = getSupabaseClient();

      console.log('[Auth] Signing in with Supabase client...');

      // Sign in using Supabase - it handles all session management
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Supabase sign in error:', error);
        throw new Error(error.message || 'Failed to sign in');
      }

      if (!data.session || !data.user) {
        throw new Error('No session returned from sign in');
      }

      console.log('[Auth] Supabase sign in successful', {
        userId: data.user.id,
        email: data.user.email,
        hasSession: !!data.session,
      });

      // Extract user info from Supabase metadata (always available, no server call needed)
      const metadataUser: User = {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        role: data.user.user_metadata?.role || 'user',
      };

      // Try to get enriched profile from server (may have updated name/role from KV store)
      // This is optional - if it fails, we use the metadata
      try {
        const token = data.session.access_token;
        const userResponse = await fetch(`${API_URL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('[Auth] Server profile fetched successfully', {
            userId: userData.user?.id,
            role: userData.user?.role,
          });
          return { user: userData.user };
        } else {
          console.warn('[Auth] Server profile fetch failed (using Supabase metadata instead):', {
            status: userResponse.status,
          });
        }
      } catch (serverErr) {
        console.warn('[Auth] Server profile fetch error (using Supabase metadata instead):', serverErr);
      }

      // Fallback to Supabase metadata
      console.log('[Auth] Using Supabase metadata for user profile:', {
        userId: metadataUser.id,
        role: metadataUser.role,
        name: metadataUser.name,
      });

      return { user: metadataUser };
    } catch (err: any) {
      console.error('[Auth] Sign in error:', err);
      if (err.message === 'Failed to fetch' || err.message.includes('NetworkError') || err.message.includes('network')) {
        throw new Error('Unable to connect to authentication server. Please check your internet connection or try again later.');
      }
      throw err;
    }
  },

  /**
   * Get current user from Supabase session
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = getSupabaseClient();

      // Get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] Error getting session:', error);
        return null;
      }

      if (!session) {
        console.log('[Auth] No active session');
        return null;
      }

      // Check if session is expired
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        console.log('[Auth] Session is expired, signing out...');
        await supabase.auth.signOut();
        return null;
      }

      // Extract user info from Supabase metadata (always available)
      const metadataUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        role: session.user.user_metadata?.role || 'user',
      };

      // Try to get enriched profile from server
      try {
        const token = session.access_token;
        const response = await fetch(`${API_URL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.user;
        } else {
          console.warn('[Auth] Server profile fetch failed (using Supabase metadata):', {
            status: response.status,
          });
          // If 401, the token may be invalid - try refreshing
          if (response.status === 401) {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshData.session) {
              console.log('[Auth] Session refresh failed, signing out...');
              await supabase.auth.signOut();
              return null;
            }
            // Try server call one more time with refreshed token
            try {
              const retryResponse = await fetch(`${API_URL}/auth/user`, {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'X-User-Token': refreshData.session.access_token,
                },
              });
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                return retryData.user;
              }
            } catch {}
          }
        }
      } catch (serverErr) {
        console.warn('[Auth] Server profile fetch error (using Supabase metadata):', serverErr);
      }

      // Fallback to metadata
      return metadataUser;
    } catch (error) {
      console.error('[Auth] Error getting current user:', error);
      return null;
    }
  },

  /**
   * Sign out using Supabase client
   */
  async signOut() {
    try {
      const supabase = getSupabaseClient();
      
      // Get current session to revoke on server
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Notify server to clean up session
        try {
          await fetch(`${API_URL}/auth/signout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-User-Token': session.access_token,
            },
          });
        } catch (error) {
          console.error('[Auth] Error notifying server of signout:', error);
        }
      }

      // Sign out from Supabase - this clears the session
      await supabase.auth.signOut();

      console.log('[Auth] Signed out successfully');
    } catch (error) {
      console.error('[Auth] Error signing out:', error);
      // Force sign out even if there's an error
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    }
  },

  /**
   * Get the current access token from Supabase session
   */
  async getToken(): Promise<string | null> {
    try {
      const supabase = getSupabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] Error getting session for token:', error);
        return null;
      }

      return session?.access_token || null;
    } catch (error) {
      console.error('[Auth] Error getting token:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(name: string): Promise<User> {
    const token = await this.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-User-Token': token,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    const data = await response.json();
    return data.user;
  },

  /**
   * Change password
   */
  async changePassword(newPassword: string): Promise<void> {
    const token = await this.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-User-Token': token,
      },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(role: 'user' | 'driver' | 'admin'): Promise<void> {
    const supabase = getSupabaseClient();
    
    // Store the intended role in localStorage so we can retrieve it after redirect
    localStorage.setItem('google_oauth_role', role);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    
    if (error) {
      console.error('[Auth] Google OAuth error:', error);
      throw new Error(error.message || 'Failed to initiate Google sign-in');
    }
  },

  /**
   * Handle Google OAuth callback after redirect
   */
  async handleGoogleCallback(): Promise<AuthResponse | null> {
    try {
      const supabase = getSupabaseClient();
      
      console.log('[Auth] Handling Google OAuth callback...');
      
      // Get the session from Supabase (it should be automatically restored)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('[Auth] No session after OAuth callback:', error);
        return null;
      }
      
      console.log('[Auth] OAuth session retrieved', {
        userId: session.user.id,
        email: session.user.email
      });
      
      // Get the role that was stored before OAuth redirect
      const role = localStorage.getItem('google_oauth_role') || 'user';
      localStorage.removeItem('google_oauth_role');
      
      // Check if user exists in our system
      const token = session.access_token;
      const userResponse = await fetch(`${API_URL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': token,
        },
      });
      
      if (userResponse.ok) {
        // User exists, return their profile
        const userData = await userResponse.json();
        console.log('[Auth] Existing user logged in via Google:', userData.user);
        return { user: userData.user };
      }
      
      // User doesn't exist, create their profile
      console.log('[Auth] New Google user, creating profile...');
      
      const name = session.user.user_metadata?.full_name || 
                   session.user.user_metadata?.name || 
                   session.user.email?.split('@')[0] || 
                   'User';
      
      // Create user profile on server
      const createResponse = await fetch(`${API_URL}/auth/google-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': token,
        },
        body: JSON.stringify({
          name,
          role: role as 'user' | 'driver' | 'admin'
        }),
      });
      
      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Failed to create user profile');
      }
      
      const newUserData = await createResponse.json();
      console.log('[Auth] Google user profile created:', newUserData.user);
      
      return { user: newUserData.user };
    } catch (error) {
      console.error('[Auth] Error handling Google callback:', error);
      return null;
    }
  },
};