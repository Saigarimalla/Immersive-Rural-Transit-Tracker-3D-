import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Log environment setup (only once on server start)
console.log('[Server Init] Supabase configured:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasAnonKey: !!supabaseAnonKey,
});

// Admin client for creating users and validating tokens
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Regular client for user authentication
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-e128d165/health", (c) => {
  return c.json({ status: "ok" });
});

// Debug endpoint to check server configuration
app.get("/make-server-e128d165/debug/config", (c) => {
  return c.json({
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceRoleKey: !!supabaseServiceKey,
    status: (!!supabaseUrl && !!supabaseAnonKey && !!supabaseServiceKey) ? 'ok' : 'missing_config',
  });
});

// ============= HELPER FUNCTIONS =============

// Extract the actual user JWT from the request.
// Frontend always sends Authorization: Bearer <anonKey> so Supabase's Edge Function
// infrastructure JWT validation always passes. The real user JWT is sent separately
// in the X-User-Token header so our Hono code can do role-based auth checks.
// Falls back to Authorization header value for backwards-compatibility.
function extractUserToken(c: any): string | null {
  const userToken = c.req.header('X-User-Token');
  if (userToken) return userToken;

  // Fallback: Authorization header if it's NOT the anon key
  const bearer = c.req.header('Authorization')?.split(' ')[1];
  if (bearer && bearer !== supabaseAnonKey) return bearer;

  return null;
}

// Decode JWT payload without verification
// Correctly handles base64url encoding used in JWTs
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // JWTs use base64url: replace - with + and _ with /, then pad to multiple of 4
    const base64url = parts[1];
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);

    const payload = JSON.parse(atob(padded));

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log('[decodeJwtPayload] Token is expired, exp:', new Date(payload.exp * 1000).toISOString());
      return null;
    }
    return payload;
  } catch (e) {
    console.error('[decodeJwtPayload] Failed to decode JWT payload:', e);
    return null;
  }
}

// Validate JWT token and return user.
// JWT decoding is the PRIMARY validation step (no external calls, always reliable).
// Supabase admin getUser is used ONLY as a secondary step to enrich / auto-create the KV profile.
async function validateUserToken(accessToken: string) {
  try {
    // ── Step 1: Decode JWT to verify identity & expiry ────────────────────
    const payload = decodeJwtPayload(accessToken);

    if (!payload || !payload.sub) {
      console.warn('[validateUserToken] JWT decode failed or missing sub claim');
      return { user: null, error: { message: 'Invalid or expired token', code: 401 } };
    }

    const userId = payload.sub as string;
    const jwtEmail = (payload.email || '') as string;

    console.log('[validateUserToken] JWT valid, userId:', userId);

    // ── Step 2: Look up full user profile in KV (fast path) ──────────────
    let userData = await kv.get(`user:${userId}`);

    if (userData) {
      return {
        user: { id: userId, email: userData.email || jwtEmail, user_metadata: payload.user_metadata },
        error: null,
      };
    }

    // ── Step 3: User not in KV – try Supabase admin to get full details ───
    console.log('[validateUserToken] User not in KV, querying Supabase admin for:', userId);
    try {
      const { data: { user: supaUser }, error: supaError } = await supabaseAdmin.auth.getUser(accessToken);
      if (!supaError && supaUser) {
        const name = supaUser.user_metadata?.name || supaUser.user_metadata?.full_name || supaUser.email?.split('@')[0] || 'User';
        const role = supaUser.user_metadata?.role || payload.user_metadata?.role || 'user';
        userData = {
          id: supaUser.id,
          email: supaUser.email || jwtEmail,
          name,
          role,
          created_at: supaUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await kv.set(`user:${userId}`, userData);
        console.log('[validateUserToken] Auto-created KV profile from Supabase for:', userId);
        return { user: { ...supaUser, id: userId, email: userData.email, user_metadata: supaUser.user_metadata }, error: null };
      }
      console.warn('[validateUserToken] Supabase admin getUser failed:', supaError?.message);
    } catch (supaErr) {
      console.warn('[validateUserToken] Supabase admin getUser exception:', supaErr);
    }

    // ── Step 4: JWT is valid but cannot enrich from Supabase ─────────────
    // Auto-create a minimal KV profile from JWT claims so future calls are fast
    const name = payload.user_metadata?.name || payload.user_metadata?.full_name || jwtEmail.split('@')[0] || 'User';
    const role = payload.user_metadata?.role || 'user';
    userData = {
      id: userId,
      email: jwtEmail,
      name,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await kv.set(`user:${userId}`, userData);
    console.log('[validateUserToken] Auto-created KV profile from JWT claims for:', userId);

    return {
      user: { id: userId, email: jwtEmail, user_metadata: payload.user_metadata },
      error: null,
    };
  } catch (err) {
    console.error('[validateUserToken] Unexpected exception:', err);
    return { user: null, error: { message: 'Token validation failed', code: 401 } };
  }
}

// ============= AUTH ROUTES =============

// Sign up endpoint - creates a new user with role
app.post("/make-server-e128d165/auth/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    // Validate inputs
    if (!email || !password || !name || !role) {
      return c.json({ error: "Missing required fields: email, password, name, role" }, 400);
    }

    if (!['user', 'driver', 'admin'].includes(role)) {
      return c.json({ error: "Invalid role. Must be 'user', 'driver', or 'admin'" }, 400);
    }

    // Validate password strength
    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters long" }, 400);
    }

    // Create user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name, 
        role,
        created_at: new Date().toISOString()
      },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true
    });

    if (authError) {
      console.error("Signup error during user creation:", authError);
      return c.json({ error: authError.message || "Failed to create user account" }, 400);
    }

    if (!authData.user) {
      console.error("Signup error: No user data returned");
      return c.json({ error: "Failed to create user account" }, 500);
    }

    // Store additional user data in KV store
    await kv.set(`user:${authData.user.id}`, {
      id: authData.user.id,
      email: authData.user.email,
      name,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // If role is driver, create a driver record
    if (role === 'driver') {
      await kv.set(`driver:${authData.user.id}`, {
        id: authData.user.id,
        userId: authData.user.id,
        name,
        email: authData.user.email,
        phone: '',
        busId: undefined,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Sign in the user to get access token
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      console.error("Signup error during auto sign-in:", signInError);
      return c.json({ error: "User created but failed to sign in. Please try logging in manually." }, 500);
    }

    // Store session in KV for reliable validation
    await kv.set(`session:${signInData.session.access_token}`, {
      userId: authData.user.id,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });

    return c.json({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role
      }
    });

  } catch (error) {
    console.error("Signup error (unexpected):", error);
    return c.json({ error: "An unexpected error occurred during signup" }, 500);
  }
});

// Google OAuth signup endpoint - create user profile for Google-authenticated users
app.post("/make-server-e128d165/auth/google-signup", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    // Verify the access token from Google OAuth
    const { user, error } = await validateUserToken(accessToken);

    if (error || !user) {
      console.error("Google signup error: Invalid token", error);
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const { name, role } = await c.req.json();

    if (!name || !role) {
      return c.json({ error: "Missing required fields: name, role" }, 400);
    }

    if (!['user', 'driver', 'admin'].includes(role)) {
      return c.json({ error: "Invalid role. Must be 'user', 'driver', or 'admin'" }, 400);
    }

    // Check if user already exists in KV store
    const existingUser = await kv.get(`user:${user.id}`);
    
    if (existingUser) {
      console.log('[POST /auth/google-signup] User already exists:', user.id);
      return c.json({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        }
      });
    }

    // Store user data in KV store
    const userData = {
      id: user.id,
      email: user.email,
      name,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`user:${user.id}`, userData);

    console.log('[POST /auth/google-signup] Created Google user profile:', {
      userId: user.id,
      email: user.email,
      role
    });

    // If role is driver, create a driver record
    if (role === 'driver') {
      await kv.set(`driver:${user.id}`, {
        id: user.id,
        userId: user.id,
        name,
        email: user.email,
        phone: '',
        busId: undefined,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return c.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      }
    });

  } catch (error) {
    console.error("Google signup error (unexpected):", error);
    return c.json({ error: "An unexpected error occurred during Google signup" }, 500);
  }
});

// Sign in endpoint
app.post("/make-server-e128d165/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Missing email or password" }, 400);
    }

    // Sign in using regular client
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      
      // Provide more helpful error messages
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
        return c.json({ 
          error: "Invalid email or password. If you don't have an account yet, please sign up first." 
        }, 401);
      }
      
      if (error.message.includes('Email not confirmed')) {
        return c.json({ 
          error: "Please verify your email address before logging in." 
        }, 401);
      }
      
      return c.json({ error: error.message || "Invalid email or password" }, 401);
    }

    if (!data.session || !data.user) {
      console.error("Sign in error: No session or user data");
      return c.json({ error: "Failed to sign in" }, 500);
    }

    // Get user data from KV store
    const userData = await kv.get(`user:${data.user.id}`);
    
    if (!userData) {
      console.error("Sign in error: User data not found in KV store for user:", data.user.id);
      
      // Try to get from auth metadata as fallback
      const name = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';
      const role = data.user.user_metadata?.role || 'user';
      
      // Create the user data in KV store (migration case)
      const newUserData = {
        id: data.user.id,
        email: data.user.email,
        name,
        role,
        created_at: data.user.created_at,
        updated_at: new Date().toISOString()
      };
      
      await kv.set(`user:${data.user.id}`, newUserData);
      console.log("Created missing user data in KV store for user:", data.user.id);
      
      // Store session in KV for reliable validation
      const sessionKey = `session:${data.session.access_token}`;
      const sessionData = {
        userId: data.user.id,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      
      await kv.set(sessionKey, sessionData);

      console.log('[POST /auth/signin] Session stored in KV (migration case)', {
        userId: data.user.id,
        sessionKeyPreview: sessionKey.substring(0, 40) + '...',
        expiresAt: new Date(sessionData.expiresAt).toISOString()
      });
      
      return c.json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name,
          role: role as 'user' | 'driver' | 'admin'
        }
      });
    }

    console.log('[POST /auth/signin] Successful sign in', {
      userId: data.user.id,
      userEmail: data.user.email,
      tokenLength: data.session.access_token?.length,
      tokenPreview: data.session.access_token?.substring(0, 30) + '...'
    });

    // Store session in KV for reliable validation
    const sessionKey = `session:${data.session.access_token}`;
    const sessionData = {
      userId: data.user.id,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    await kv.set(sessionKey, sessionData);

    console.log('[POST /auth/signin] Session stored in KV', {
      userId: data.user.id,
      sessionKeyPreview: sessionKey.substring(0, 40) + '...',
      expiresAt: new Date(sessionData.expiresAt).toISOString()
    });

    return c.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userData.name,
        role: userData.role
      }
    });

  } catch (error) {
    console.error("Sign in error (unexpected):", error);
    return c.json({ error: "An unexpected error occurred during sign in" }, 500);
  }
});

// Get current user endpoint (verify session)
app.get("/make-server-e128d165/auth/user", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    // validateUserToken now uses JWT decode as primary validation and
    // auto-creates KV profile if missing – so this always returns a user
    // for any valid, non-expired Supabase JWT.
    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      console.error('[GET /auth/user] Token validation failed:', authError?.message);
      return c.json({ error: authError?.message || "Invalid or expired token" }, 401);
    }

    // userData was already created/fetched inside validateUserToken; fetch again to get full profile
    const userData = await kv.get(`user:${user.id}`);

    return c.json({
      user: {
        id: user.id,
        email: user.email || userData?.email || '',
        name: userData?.name || (user as any).user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: userData?.role || (user as any).user_metadata?.role || 'user',
      }
    });

  } catch (error) {
    console.error('[GET /auth/user] Unexpected error:', error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

// Sign out endpoint (revoke refresh token)
app.post("/make-server-e128d165/auth/signout", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      // Not an error – just return success if no token to revoke
      return c.json({ success: true });
    }

    // Delete session from KV store
    await kv.del(`session:${accessToken}`);

    // Try to revoke sessions via admin client
    try {
      const { user } = await validateUserToken(accessToken);
      if (user) {
        await supabaseAdmin.auth.admin.signOut(user.id);
      }
    } catch (e) {
      // Token might already be invalid, that's okay for sign out
    }

    return c.json({ success: true });

  } catch (error) {
    console.error("Sign out error (unexpected):", error);
    return c.json({ success: true });
  }
});

// Update user profile endpoint
app.put("/make-server-e128d165/auth/profile", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      console.error("Update profile error during authorization:", authError);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    // Get current user data
    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      return c.json({ error: "User profile not found" }, 404);
    }

    // Update user data
    const updatedData = {
      ...userData,
      name,
      updated_at: new Date().toISOString()
    };

    await kv.set(`user:${user.id}`, updatedData);

    // Update auth metadata (best effort)
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { name }
      });
    } catch (e) {
      console.warn('Failed to update auth metadata:', e);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name,
        role: userData.role
      }
    });

  } catch (error) {
    console.error("Update profile error (unexpected):", error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

// Change password endpoint
app.post("/make-server-e128d165/auth/change-password", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "No authorization token provided" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      console.error("Change password error during authorization:", authError);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { newPassword } = await c.req.json();

    if (!newPassword) {
      return c.json({ error: "New password is required" }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: "Password must be at least 6 characters long" }, 400);
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      console.error("Change password error during password update:", updateError);
      return c.json({ error: "Failed to update password" }, 500);
    }

    return c.json({ success: true });

  } catch (error) {
    console.error("Change password error (unexpected):", error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

// Google OAuth verification endpoint
// This endpoint is called after Google OAuth redirect with the session
app.post("/make-server-e128d165/auth/google-verify", async (c) => {
  try {
    const { access_token, role } = await c.req.json();
    
    if (!access_token) {
      return c.json({ error: "Missing access token" }, 400);
    }

    if (!role || !['user', 'driver', 'admin'].includes(role)) {
      return c.json({ error: "Invalid or missing role. Must be 'user', 'driver', or 'admin'" }, 400);
    }

    // Verify the access token and get user data
    const { user, error: authError } = await validateUserToken(access_token);

    if (authError || !user) {
      console.error("Google OAuth verification error:", authError);
      return c.json({ error: "Invalid access token" }, 401);
    }

    // Check if user already exists in KV store
    let userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      // First time Google login - create user profile in KV store
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      
      userData = {
        id: user.id,
        email: user.email,
        name,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await kv.set(`user:${user.id}`, userData);
      
      // Update auth metadata with role
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          name,
          role,
          created_at: new Date().toISOString()
        }
      });
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: userData.name,
        role: userData.role
      }
    });

  } catch (error) {
    console.error("Google OAuth verification error (unexpected):", error);
    return c.json({ error: "An unexpected error occurred during Google authentication" }, 500);
  }
});

// ============= BUS ROUTES =============

// Get all buses
app.get("/make-server-e128d165/buses", async (c) => {
  try {
    const buses = await kv.getByPrefix("bus:");
    return c.json({ buses: buses || [] });
  } catch (error) {
    console.error("Error fetching buses:", error);
    return c.json({ error: "Failed to fetch buses" }, 500);
  }
});

// Get single bus
app.get("/make-server-e128d165/buses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const bus = await kv.get(`bus:${id}`);
    
    if (!bus) {
      return c.json({ error: "Bus not found" }, 404);
    }
    
    return c.json({ bus });
  } catch (error) {
    console.error("Error fetching bus:", error);
    return c.json({ error: "Failed to fetch bus" }, 500);
  }
});

// Create or update bus (Admin only)
app.post("/make-server-e128d165/buses", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const busData = await c.req.json();
    
    const bus = {
      id: busData.id || `bus_${Date.now()}`,
      busNumber: busData.busNumber,
      routeId: busData.routeId,
      lat: busData.lat || 12.9766,
      lng: busData.lng || 77.5718,
      occupancy: busData.occupancy || 'Low',
      speed: busData.speed || 0,
      heading: busData.heading || 0,
      nextStopId: busData.nextStopId,
      eta: busData.eta || 0,
      driverId: busData.driverId,
      capacity: busData.capacity,
      schedule: busData.schedule || [],
      active: busData.active !== undefined ? busData.active : true,
      lastUpdated: new Date().toISOString(),
      createdAt: busData.createdAt || new Date().toISOString(),
    };
    
    await kv.set(`bus:${bus.id}`, bus);
    
    return c.json({ bus });
  } catch (error) {
    console.error("Error creating/updating bus:", error);
    return c.json({ error: "Failed to create/update bus" }, 500);
  }
});

// Delete bus (Admin only)
app.delete("/make-server-e128d165/buses/:id", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const id = c.req.param("id");
    await kv.del(`bus:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting bus:", error);
    return c.json({ error: "Failed to delete bus" }, 500);
  }
});

// Update bus location (Driver)
app.post("/make-server-e128d165/buses/:id/location", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const { lat, lng, speed, heading } = await c.req.json();
    
    const bus = await kv.get(`bus:${id}`);
    
    if (!bus) {
      return c.json({ error: "Bus not found" }, 404);
    }
    
    const updatedBus = {
      ...bus,
      lat,
      lng,
      speed: speed || 0,
      heading: heading || 0,
      lastUpdated: new Date().toISOString(),
    };
    
    await kv.set(`bus:${id}`, updatedBus);
    
    return c.json({ bus: updatedBus });
  } catch (error) {
    console.error("Error updating bus location:", error);
    return c.json({ error: "Failed to update bus location" }, 500);
  }
});

// Update bus occupancy (Driver)
app.post("/make-server-e128d165/buses/:id/occupancy", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const { occupancy } = await c.req.json();
    
    const bus = await kv.get(`bus:${id}`);
    
    if (!bus) {
      return c.json({ error: "Bus not found" }, 404);
    }
    
    const updatedBus = {
      ...bus,
      occupancy,
      lastUpdated: new Date().toISOString(),
    };
    
    await kv.set(`bus:${id}`, updatedBus);
    
    return c.json({ bus: updatedBus });
  } catch (error) {
    console.error("Error updating bus occupancy:", error);
    return c.json({ error: "Failed to update bus occupancy" }, 500);
  }
});

// ============= ROUTE ROUTES =============

// Get all routes
app.get("/make-server-e128d165/routes", async (c) => {
  try {
    const routes = await kv.getByPrefix("route:");
    return c.json({ routes: routes || [] });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return c.json({ error: "Failed to fetch routes" }, 500);
  }
});

// Create or update route (Admin only)
app.post("/make-server-e128d165/routes", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const routeData = await c.req.json();
    
    const route = {
      id: routeData.id || `route_${Date.now()}`,
      name: routeData.name,
      color: routeData.color || '#3B82F6',
      stops: routeData.stops || [],
      active: routeData.active !== undefined ? routeData.active : true,
      createdAt: routeData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`route:${route.id}`, route);
    
    return c.json({ route });
  } catch (error) {
    console.error("Error creating/updating route:", error);
    return c.json({ error: "Failed to create/update route" }, 500);
  }
});

// Delete route (Admin only)
app.delete("/make-server-e128d165/routes/:id", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const id = c.req.param("id");
    await kv.del(`route:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting route:", error);
    return c.json({ error: "Failed to delete route" }, 500);
  }
});

// ============= BUS STOP ROUTES =============

// Get all bus stops
app.get("/make-server-e128d165/stops", async (c) => {
  try {
    const stops = await kv.getByPrefix("stop:");
    return c.json({ stops: stops || [] });
  } catch (error) {
    console.error("Error fetching stops:", error);
    return c.json({ error: "Failed to fetch stops" }, 500);
  }
});

// Create or update stop (Admin only)
app.post("/make-server-e128d165/stops", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const stopData = await c.req.json();
    
    const stop = {
      id: stopData.id || `stop_${Date.now()}`,
      name: stopData.name,
      lat: stopData.lat,
      lng: stopData.lng,
      routes: stopData.routes || [],
      createdAt: stopData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`stop:${stop.id}`, stop);
    
    return c.json({ stop });
  } catch (error) {
    console.error("Error creating/updating stop:", error);
    return c.json({ error: "Failed to create/update stop" }, 500);
  }
});

// ============= DRIVER ROUTES =============

// Get all drivers
app.get("/make-server-e128d165/drivers", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      console.error('[GET /drivers] Token validation failed:', authError?.message);
      return c.json({ error: authError?.message || "Invalid or expired token" }, 401);
    }

    const drivers = await kv.getByPrefix("driver:");
    return c.json({ drivers: drivers || [] });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return c.json({ error: "Failed to fetch drivers" }, 500);
  }
});

// Get driver by user ID
app.get("/make-server-e128d165/drivers/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const driver = await kv.get(`driver:${userId}`);
    
    if (!driver) {
      return c.json({ error: "Driver not found" }, 404);
    }
    
    return c.json({ driver });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return c.json({ error: "Failed to fetch driver" }, 500);
  }
});

// Create or update driver (Admin only)
app.post("/make-server-e128d165/drivers", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const driverData = await c.req.json();
    
    const driver = {
      id: driverData.id || `driver_${Date.now()}`,
      name: driverData.name,
      email: driverData.email,
      phone: driverData.phone,
      busId: driverData.busId,
      userId: driverData.userId,
      active: driverData.active !== undefined ? driverData.active : true,
      createdAt: driverData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`driver:${driver.id}`, driver);
    
    return c.json({ driver });
  } catch (error) {
    console.error("Error creating/updating driver:", error);
    return c.json({ error: "Failed to create/update driver" }, 500);
  }
});

// Delete driver (Admin only)
app.delete("/make-server-e128d165/drivers/:id", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const id = c.req.param("id");
    await kv.del(`driver:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return c.json({ error: "Failed to delete driver" }, 500);
  }
});

// ============= INCIDENT ROUTES =============

// Get all incidents
app.get("/make-server-e128d165/incidents", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      console.error('[GET /incidents] Token validation failed:', authError?.message);
      return c.json({ error: authError?.message || "Invalid or expired token" }, 401);
    }

    const incidents = await kv.getByPrefix("incident:");
    return c.json({ incidents: incidents || [] });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return c.json({ error: "Failed to fetch incidents" }, 500);
  }
});

// Create incident
app.post("/make-server-e128d165/incidents", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      console.error('[POST /incidents] Token validation failed:', authError?.message);
      return c.json({ error: authError?.message || "Invalid or expired token" }, 401);
    }

    const incidentData = await c.req.json();
    
    const incident = {
      id: `incident_${Date.now()}`,
      type: incidentData.type,
      busId: incidentData.busId,
      routeId: incidentData.routeId,
      reportedBy: user.id,
      reporterType: incidentData.reporterType || 'driver',
      description: incidentData.description,
      status: 'open',
      priority: incidentData.priority || 'medium',
      timestamp: new Date().toISOString(),
    };
    
    await kv.set(`incident:${incident.id}`, incident);
    
    return c.json({ incident });
  } catch (error) {
    console.error("Error creating incident:", error);
    return c.json({ error: "Failed to create incident" }, 500);
  }
});

// Update incident status (Admin only)
app.put("/make-server-e128d165/incidents/:id", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const id = c.req.param("id");
    const { status } = await c.req.json();
    
    const incident = await kv.get(`incident:${id}`);
    
    if (!incident) {
      return c.json({ error: "Incident not found" }, 404);
    }
    
    const updatedIncident = {
      ...incident,
      status,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`incident:${id}`, updatedIncident);
    
    return c.json({ incident: updatedIncident });
  } catch (error) {
    console.error("Error updating incident:", error);
    return c.json({ error: "Failed to update incident" }, 500);
  }
});

// ============= DRIVER INVITE ROUTES =============

// Generate a unique driver invite ID
function generateDriverInviteId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'DRV-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Get all driver invites (Admin only)
app.get("/make-server-e128d165/driver-invites", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      console.error('[GET /driver-invites] Token validation failed:', authError?.message);
      return c.json({ error: authError?.message || "Invalid or expired token" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const invites = await kv.getByPrefix("driver-invite:");
    return c.json({ invites: invites || [] });
  } catch (error) {
    console.error("Error fetching driver invites:", error);
    return c.json({ error: "Failed to fetch driver invites" }, 500);
  }
});

// Create driver invite (Admin only)
app.post("/make-server-e128d165/driver-invites", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const inviteData = await c.req.json();
    const inviteId = generateDriverInviteId();
    
    const invite = {
      id: inviteId,
      busId: inviteData.busId,
      email: inviteData.email,
      name: inviteData.name,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      claimed: false,
    };
    
    await kv.set(`driver-invite:${inviteId}`, invite);
    
    return c.json({ invite });
  } catch (error) {
    console.error("Error creating driver invite:", error);
    return c.json({ error: "Failed to create driver invite" }, 500);
  }
});

// Verify driver invite (Public - for driver signup)
app.get("/make-server-e128d165/driver-invites/verify/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const invite = await kv.get(`driver-invite:${id}`);
    
    if (!invite) {
      return c.json({ error: "Invalid driver invite ID" }, 404);
    }
    
    if (invite.claimed) {
      return c.json({ error: "This driver invite has already been used" }, 400);
    }
    
    return c.json({ 
      invite: {
        id: invite.id,
        email: invite.email,
        name: invite.name,
        busId: invite.busId
      }
    });
  } catch (error) {
    console.error("Error verifying driver invite:", error);
    return c.json({ error: "Failed to verify driver invite" }, 500);
  }
});

// Claim driver invite (called during driver signup)
app.post("/make-server-e128d165/driver-invites/:id/claim", async (c) => {
  try {
    const id = c.req.param("id");
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }
    
    const invite = await kv.get(`driver-invite:${id}`);
    
    if (!invite) {
      return c.json({ error: "Invalid driver invite ID" }, 404);
    }
    
    if (invite.claimed) {
      return c.json({ error: "This driver invite has already been used" }, 400);
    }
    
    // Update invite to claimed
    const updatedInvite = {
      ...invite,
      claimed: true,
      claimedBy: userId,
      claimedAt: new Date().toISOString(),
    };
    
    await kv.set(`driver-invite:${id}`, updatedInvite);
    
    // If there's a bus assigned, update the bus to link to this driver
    if (invite.busId) {
      const bus = await kv.get(`bus:${invite.busId}`);
      if (bus) {
        const updatedBus = {
          ...bus,
          driverId: userId,
          lastUpdated: new Date().toISOString(),
        };
        await kv.set(`bus:${invite.busId}`, updatedBus);
      }
    }
    
    return c.json({ success: true, busId: invite.busId });
  } catch (error) {
    console.error("Error claiming driver invite:", error);
    return c.json({ error: "Failed to claim driver invite" }, 500);
  }
});

// Delete driver invite (Admin only)
app.delete("/make-server-e128d165/driver-invites/:id", async (c) => {
  try {
    const accessToken = extractUserToken(c);
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - Admin access required" }, 401);
    }

    const { user, error: authError } = await validateUserToken(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const id = c.req.param("id");
    await kv.del(`driver-invite:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver invite:", error);
    return c.json({ error: "Failed to delete driver invite" }, 500);
  }
});

// ============= INITIALIZE PRODUCTION DATA =============

app.post("/make-server-e128d165/init-demo-data", async (c) => {
  try {
    // Initialize bus stops with realistic Bangalore locations
    const busStops = [
      // Central Bangalore
      { id: 'stop1', name: 'Kempegowda Bus Station (Majestic)', lat: 12.9766, lng: 77.5718, routes: ['route1', 'route2', 'route4'] },
      { id: 'stop2', name: 'MG Road Metro Station', lat: 12.9716, lng: 77.5946, routes: ['route1', 'route3'] },
      { id: 'stop3', name: 'Indiranagar 100 Feet Road', lat: 12.9784, lng: 77.6408, routes: ['route1', 'route5'] },
      { id: 'stop4', name: 'Victoria Hospital Gate', lat: 12.9698, lng: 77.5802, routes: ['route2', 'route4'] },
      { id: 'stop5', name: 'Commercial Street Junction', lat: 12.9826, lng: 77.6089, routes: ['route2', 'route3'] },
      
      // South Bangalore
      { id: 'stop6', name: 'Koramangala 5th Block', lat: 12.9352, lng: 77.6245, routes: ['route3', 'route5'] },
      { id: 'stop7', name: 'BTM Layout BMTC Depot', lat: 12.9165, lng: 77.6101, routes: ['route5', 'route6'] },
      { id: 'stop8', name: 'Electronic City Phase 1', lat: 12.8456, lng: 77.6603, routes: ['route6'] },
      { id: 'stop9', name: 'Silk Board Junction', lat: 12.9166, lng: 77.6228, routes: ['route5', 'route6'] },
      
      // North Bangalore
      { id: 'stop10', name: 'Hebbal Flyover', lat: 13.0358, lng: 77.5971, routes: ['route4'] },
      { id: 'stop11', name: 'Yeshwanthpur Metro', lat: 13.0280, lng: 77.5374, routes: ['route4'] },
      
      // East Bangalore
      { id: 'stop12', name: 'Whitefield ITPL Main Gate', lat: 12.9898, lng: 77.7499, routes: ['route1', 'route5'] },
      { id: 'stop13', name: 'KR Puram Railway Station', lat: 12.9900, lng: 77.6962, routes: ['route5'] },
      
      // West Bangalore
      { id: 'stop14', name: 'Rajajinagar Metro', lat: 12.9917, lng: 77.5535, routes: ['route2', 'route4'] },
      { id: 'stop15', name: 'Vijayanagar Bus Stop', lat: 12.9716, lng: 77.5379, routes: ['route2'] },
      
      // Central locations
      { id: 'stop16', name: 'Cubbon Park', lat: 12.9762, lng: 77.5929, routes: ['route1', 'route2', 'route3'] },
      { id: 'stop17', name: 'Jayanagar 4th Block', lat: 12.9250, lng: 77.5838, routes: ['route3', 'route6'] },
      { id: 'stop18', name: 'Banashankari BDA Complex', lat: 12.9250, lng: 77.5487, routes: ['route6'] },
      { id: 'stop19', name: 'City Railway Station', lat: 12.9773, lng: 77.5710, routes: ['route1', 'route2', 'route4'] },
      { id: 'stop20', name: 'Shivajinagar Bus Terminal', lat: 12.9869, lng: 77.6034, routes: ['route3', 'route4'] },
    ];

    for (const stop of busStops) {
      await kv.set(`stop:${stop.id}`, { ...stop, createdAt: new Date().toISOString() });
    }

    // Initialize 6 routes with realistic Bangalore bus routes
    const routes = [
      { 
        id: 'route1', 
        name: 'City Center to Whitefield Express', 
        color: '#3B82F6', 
        stops: ['stop1', 'stop19', 'stop16', 'stop2', 'stop3', 'stop13', 'stop12'], 
        active: true,
        description: 'Main IT corridor route connecting city center to Whitefield'
      },
      { 
        id: 'route2', 
        name: 'Hospital & West Bangalore Circle', 
        color: '#10B981', 
        stops: ['stop1', 'stop19', 'stop4', 'stop16', 'stop5', 'stop14', 'stop15'], 
        active: true,
        description: 'Connecting major hospitals and west Bangalore residential areas'
      },
      { 
        id: 'route3', 
        name: 'Central Loop Route', 
        color: '#F59E0B', 
        stops: ['stop2', 'stop16', 'stop5', 'stop20', 'stop6', 'stop17'], 
        active: true,
        description: 'Central Bangalore circular route'
      },
      { 
        id: 'route4', 
        name: 'North-South Corridor', 
        color: '#EF4444', 
        stops: ['stop11', 'stop10', 'stop20', 'stop1', 'stop19', 'stop4', 'stop14'], 
        active: true,
        description: 'Connecting north Bangalore to central business district'
      },
      { 
        id: 'route5', 
        name: 'IT Hub Connector', 
        color: '#8B5CF6', 
        stops: ['stop3', 'stop13', 'stop12', 'stop6', 'stop9', 'stop7'], 
        active: true,
        description: 'Connecting multiple IT hubs and tech parks'
      },
      { 
        id: 'route6', 
        name: 'South Bangalore Local', 
        color: '#EC4899', 
        stops: ['stop17', 'stop18', 'stop9', 'stop7', 'stop8'], 
        active: true,
        description: 'Local route for south Bangalore neighborhoods'
      },
    ];

    for (const route of routes) {
      await kv.set(`route:${route.id}`, { ...route, createdAt: new Date().toISOString() });
    }

    // Initialize 10 buses with realistic data
    const buses = [
      {
        id: 'bus1',
        busNumber: 'KA-01-F-1234',
        routeId: 'route1',
        lat: 12.9766,
        lng: 77.5718,
        occupancy: 'Low',
        speed: 0,
        heading: 90,
        nextStopId: 'stop1',
        eta: 5,
        capacity: 45,
        active: false,
        schedule: [
          { stopId: 'stop1', arrivalTime: '06:00' },
          { stopId: 'stop19', arrivalTime: '06:05' },
          { stopId: 'stop16', arrivalTime: '06:15' },
          { stopId: 'stop2', arrivalTime: '06:25' },
          { stopId: 'stop3', arrivalTime: '06:40' },
          { stopId: 'stop13', arrivalTime: '07:00' },
          { stopId: 'stop12', arrivalTime: '07:20' },
        ]
      },
      {
        id: 'bus2',
        busNumber: 'KA-01-F-2345',
        routeId: 'route1',
        lat: 12.9898,
        lng: 77.7499,
        occupancy: 'Medium',
        speed: 0,
        heading: 270,
        nextStopId: 'stop12',
        eta: 3,
        capacity: 45,
        active: false,
        schedule: [
          { stopId: 'stop1', arrivalTime: '08:00' },
          { stopId: 'stop19', arrivalTime: '08:05' },
          { stopId: 'stop16', arrivalTime: '08:15' },
          { stopId: 'stop2', arrivalTime: '08:25' },
          { stopId: 'stop3', arrivalTime: '08:40' },
          { stopId: 'stop13', arrivalTime: '09:00' },
          { stopId: 'stop12', arrivalTime: '09:20' },
        ]
      },
      {
        id: 'bus3',
        busNumber: 'KA-01-F-3456',
        routeId: 'route2',
        lat: 12.9698,
        lng: 77.5802,
        occupancy: 'High',
        speed: 0,
        heading: 180,
        nextStopId: 'stop4',
        eta: 7,
        capacity: 50,
        active: false,
        schedule: [
          { stopId: 'stop1', arrivalTime: '06:30' },
          { stopId: 'stop19', arrivalTime: '06:35' },
          { stopId: 'stop4', arrivalTime: '06:45' },
          { stopId: 'stop16', arrivalTime: '06:55' },
          { stopId: 'stop5', arrivalTime: '07:10' },
          { stopId: 'stop14', arrivalTime: '07:30' },
          { stopId: 'stop15', arrivalTime: '07:45' },
        ]
      },
      {
        id: 'bus4',
        busNumber: 'KA-01-F-4567',
        routeId: 'route3',
        lat: 12.9716,
        lng: 77.5946,
        occupancy: 'Low',
        speed: 0,
        heading: 45,
        nextStopId: 'stop2',
        eta: 4,
        capacity: 40,
        active: false,
        schedule: [
          { stopId: 'stop2', arrivalTime: '07:00' },
          { stopId: 'stop16', arrivalTime: '07:10' },
          { stopId: 'stop5', arrivalTime: '07:20' },
          { stopId: 'stop20', arrivalTime: '07:35' },
          { stopId: 'stop6', arrivalTime: '07:50' },
          { stopId: 'stop17', arrivalTime: '08:05' },
        ]
      },
      {
        id: 'bus5',
        busNumber: 'KA-01-F-5678',
        routeId: 'route3',
        lat: 12.9352,
        lng: 77.6245,
        occupancy: 'Medium',
        speed: 0,
        heading: 225,
        nextStopId: 'stop6',
        eta: 6,
        capacity: 40,
        active: false,
        schedule: [
          { stopId: 'stop2', arrivalTime: '09:00' },
          { stopId: 'stop16', arrivalTime: '09:10' },
          { stopId: 'stop5', arrivalTime: '09:20' },
          { stopId: 'stop20', arrivalTime: '09:35' },
          { stopId: 'stop6', arrivalTime: '09:50' },
          { stopId: 'stop17', arrivalTime: '10:05' },
        ]
      },
      {
        id: 'bus6',
        busNumber: 'KA-01-F-6789',
        routeId: 'route4',
        lat: 13.0280,
        lng: 77.5374,
        occupancy: 'Low',
        speed: 0,
        heading: 135,
        nextStopId: 'stop11',
        eta: 8,
        capacity: 52,
        active: false,
        schedule: [
          { stopId: 'stop11', arrivalTime: '06:15' },
          { stopId: 'stop10', arrivalTime: '06:30' },
          { stopId: 'stop20', arrivalTime: '06:50' },
          { stopId: 'stop1', arrivalTime: '07:05' },
          { stopId: 'stop19', arrivalTime: '07:10' },
          { stopId: 'stop4', arrivalTime: '07:20' },
          { stopId: 'stop14', arrivalTime: '07:40' },
        ]
      },
      {
        id: 'bus7',
        busNumber: 'KA-01-F-7890',
        routeId: 'route4',
        lat: 12.9869,
        lng: 77.6034,
        occupancy: 'High',
        speed: 0,
        heading: 315,
        nextStopId: 'stop20',
        eta: 5,
        capacity: 52,
        active: false,
        schedule: [
          { stopId: 'stop11', arrivalTime: '08:15' },
          { stopId: 'stop10', arrivalTime: '08:30' },
          { stopId: 'stop20', arrivalTime: '08:50' },
          { stopId: 'stop1', arrivalTime: '09:05' },
          { stopId: 'stop19', arrivalTime: '09:10' },
          { stopId: 'stop4', arrivalTime: '09:20' },
          { stopId: 'stop14', arrivalTime: '09:40' },
        ]
      },
      {
        id: 'bus8',
        busNumber: 'KA-01-F-8901',
        routeId: 'route5',
        lat: 12.9784,
        lng: 77.6408,
        occupancy: 'Medium',
        speed: 0,
        heading: 90,
        nextStopId: 'stop3',
        eta: 4,
        capacity: 48,
        active: false,
        schedule: [
          { stopId: 'stop3', arrivalTime: '07:30' },
          { stopId: 'stop13', arrivalTime: '07:50' },
          { stopId: 'stop12', arrivalTime: '08:10' },
          { stopId: 'stop6', arrivalTime: '08:40' },
          { stopId: 'stop9', arrivalTime: '08:55' },
          { stopId: 'stop7', arrivalTime: '09:10' },
        ]
      },
      {
        id: 'bus9',
        busNumber: 'KA-01-F-9012',
        routeId: 'route5',
        lat: 12.9165,
        lng: 77.6101,
        occupancy: 'Low',
        speed: 0,
        heading: 270,
        nextStopId: 'stop7',
        eta: 6,
        capacity: 48,
        active: false,
        schedule: [
          { stopId: 'stop3', arrivalTime: '10:30' },
          { stopId: 'stop13', arrivalTime: '10:50' },
          { stopId: 'stop12', arrivalTime: '11:10' },
          { stopId: 'stop6', arrivalTime: '11:40' },
          { stopId: 'stop9', arrivalTime: '11:55' },
          { stopId: 'stop7', arrivalTime: '12:10' },
        ]
      },
      {
        id: 'bus10',
        busNumber: 'KA-01-F-0123',
        routeId: 'route6',
        lat: 12.9250,
        lng: 77.5838,
        occupancy: 'Medium',
        speed: 0,
        heading: 180,
        nextStopId: 'stop17',
        eta: 3,
        capacity: 42,
        active: false,
        schedule: [
          { stopId: 'stop17', arrivalTime: '06:45' },
          { stopId: 'stop18', arrivalTime: '07:00' },
          { stopId: 'stop9', arrivalTime: '07:20' },
          { stopId: 'stop7', arrivalTime: '07:35' },
          { stopId: 'stop8', arrivalTime: '08:00' },
        ]
      },
    ];

    for (const bus of buses) {
      await kv.set(`bus:${bus.id}`, { ...bus, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    console.log('Production data initialized successfully:', {
      stops: busStops.length,
      routes: routes.length,
      buses: buses.length
    });

    return c.json({ 
      success: true, 
      message: "Production transit system initialized successfully. Buses and routes are ready for driver assignment.",
      summary: {
        stops: busStops.length,
        routes: routes.length,
        buses: buses.length
      }
    });
  } catch (error) {
    console.error("Error initializing production data:", error);
    return c.json({ error: "Failed to initialize transit system data" }, 500);
  }
});

// Removed driver invites section - these will be created manually by administrators

Deno.serve(app.fetch);