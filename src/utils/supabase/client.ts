import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create the singleton Supabase client instance
 * This prevents multiple GoTrueClient instances in the same browser context
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('[Supabase] Creating singleton client instance');
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: 'sb-auth-token', // Custom storage key to avoid conflicts
        }
      }
    );
  } else {
    console.log('[Supabase] Reusing existing singleton client instance');
  }
  
  return supabaseInstance;
}

/**
 * Reset the Supabase client instance (useful for testing or logout)
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
}