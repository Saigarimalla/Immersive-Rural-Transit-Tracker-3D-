import { projectId, publicAnonKey } from './supabase/info';
import { auth } from './auth';
import { getSupabaseClient } from './supabase/client';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e128d165`;

interface RequestOptions {
  method?: string;
  body?: any;
  requireAuth?: boolean;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const { method = 'GET', body, requireAuth = false } = options;
  
  let userToken: string | null = null;

  // Get token from Supabase session if auth is required
  if (requireAuth) {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[API] Error getting session:', error);
      throw new Error('Authentication error. Please log in again.');
    }

    if (!session) {
      console.error('[API] No active session for authenticated request');
      throw new Error('Your session has expired. Please log in again.');
    }

    userToken = session.access_token;

    console.log(`[API] Making authenticated request to ${endpoint}`, {
      hasToken: !!userToken,
      tokenLength: userToken?.length,
      userId: session.user?.id
    });
  }

  // IMPORTANT: Always send the publicAnonKey as the Authorization Bearer token.
  // Supabase Edge Function infrastructure validates the Authorization header JWT.
  // The anon key is always a valid project JWT so infrastructure never blocks us.
  // The actual user JWT travels in X-User-Token, which our Hono server reads
  // for authentication — completely bypassing the infrastructure check.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  };

  if (userToken) {
    headers['X-User-Token'] = userToken;
  }

  // Alias used in the 401-retry block below
  const token = userToken;
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // If we get a 401 on an authenticated request, try refreshing the session first
    if (!response.ok && response.status === 401 && requireAuth) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = typeof errorData.error === 'string'
        ? errorData.error
        : errorData.error?.message || errorData.message || 'Unauthorized';
      
      console.warn('[API] Got 401, attempting session refresh:', { errorMessage, endpoint });
      
      // Try refreshing the session before giving up
      try {
        const supabase = getSupabaseClient();
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData.session) {
          console.log('[API] Session refreshed, retrying request to', endpoint);
          // Retry with the new token in X-User-Token; anon key stays in Authorization
          const retryHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': refreshData.session.access_token,
          };
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: retryHeaders,
            body: body ? JSON.stringify(body) : undefined,
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
          const retryError = await retryResponse.json().catch(() => ({ error: 'Request failed after refresh' }));
          console.error('[API] Retry after refresh also failed:', { endpoint, status: retryResponse.status, error: retryError });
          throw new Error(typeof retryError.error === 'string' ? retryError.error : retryError.error?.message || 'Request failed');
        }
        console.error('[API] Session refresh failed:', refreshError);
      } catch (refreshErr: any) {
        if (refreshErr.message && !refreshErr.message.includes('refresh')) {
          throw refreshErr;
        }
        console.error('[API] Session refresh exception:', refreshErr);
      }
      
      // Only sign out when refresh token is truly invalid
      await auth.signOut();
      window.dispatchEvent(new CustomEvent('auth-expired'));
      throw new Error('Your session has expired. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error(`API Error [${method} ${endpoint}]:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        requireAuth,
        hasToken: !!token
      });
      
      throw new Error(errorData.error?.message || errorData.error || errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    console.error(`API Request Error [${method} ${endpoint}]:`, error);
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    throw error;
  }
}

export const api = {
  // ===== BUSES =====
  async getBuses() {
    return request('/buses');
  },

  async getBus(id: string) {
    return request(`/buses/${id}`);
  },

  async createBus(bus: any) {
    return request('/buses', {
      method: 'POST',
      body: bus,
      requireAuth: true,
    });
  },

  async updateBus(bus: any) {
    return request('/buses', {
      method: 'POST',
      body: bus,
      requireAuth: true,
    });
  },

  async deleteBus(id: string) {
    return request(`/buses/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  async updateBusLocation(id: string, location: { lat: number; lng: number; speed: number; heading: number }) {
    return request(`/buses/${id}/location`, {
      method: 'POST',
      body: location,
      requireAuth: true,
    });
  },

  async updateBusOccupancy(id: string, occupancy: string) {
    return request(`/buses/${id}/occupancy`, {
      method: 'POST',
      body: { occupancy },
      requireAuth: true,
    });
  },

  // ===== ROUTES =====
  async getRoutes() {
    return request('/routes');
  },

  async createRoute(route: any) {
    return request('/routes', {
      method: 'POST',
      body: route,
      requireAuth: true,
    });
  },

  async updateRoute(route: any) {
    return request('/routes', {
      method: 'POST',
      body: route,
      requireAuth: true,
    });
  },

  async deleteRoute(id: string) {
    return request(`/routes/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  // ===== STOPS =====
  async getStops() {
    return request('/stops');
  },

  async createStop(stop: any) {
    return request('/stops', {
      method: 'POST',
      body: stop,
      requireAuth: true,
    });
  },

  async updateStop(stop: any) {
    return request('/stops', {
      method: 'POST',
      body: stop,
      requireAuth: true,
    });
  },

  // ===== DRIVERS =====
  async getDrivers() {
    return request('/drivers', {
      requireAuth: true,
    });
  },

  async getDriverByUserId(userId: string) {
    return request(`/drivers/user/${userId}`);
  },

  async createDriver(driver: any) {
    return request('/drivers', {
      method: 'POST',
      body: driver,
      requireAuth: true,
    });
  },

  async updateDriver(driver: any) {
    return request('/drivers', {
      method: 'POST',
      body: driver,
      requireAuth: true,
    });
  },

  async deleteDriver(id: string) {
    return request(`/drivers/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  // ===== INCIDENTS =====
  async getIncidents() {
    return request('/incidents', { 
      requireAuth: true 
    });
  },

  async createIncident(incident: any) {
    return request('/incidents', {
      method: 'POST',
      body: incident,
      requireAuth: true,
    });
  },

  async updateIncident(id: string, status: string) {
    return request(`/incidents/${id}`, {
      method: 'PUT',
      body: { status },
      requireAuth: true,
    });
  },

  // ===== DRIVER INVITES =====
  async getDriverInvites() {
    return request('/driver-invites', { 
      requireAuth: true 
    });
  },

  async createDriverInvite(invite: any) {
    return request('/driver-invites', {
      method: 'POST',
      body: invite,
      requireAuth: true,
    });
  },

  async verifyDriverInvite(inviteId: string) {
    return request(`/driver-invites/verify/${inviteId}`);
  },

  async claimDriverInvite(inviteId: string, userId: string) {
    return request(`/driver-invites/${inviteId}/claim`, {
      method: 'POST',
      body: { userId },
    });
  },

  async deleteDriverInvite(id: string) {
    return request(`/driver-invites/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  // ===== INIT =====
  async initDemoData() {
    return request('/init-demo-data', {
      method: 'POST',
    });
  },
};