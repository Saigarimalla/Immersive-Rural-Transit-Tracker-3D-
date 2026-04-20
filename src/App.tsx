import { useState, useEffect } from 'react';
import LandingPage from './components/auth/LandingPage';
import LoginPortalSelector from './components/auth/LoginPortalSelector';
import UserLogin from './components/auth/UserLogin';
import UserSignup from './components/auth/UserSignup';
import DriverLogin from './components/auth/DriverLogin';
import DriverSignup from './components/auth/DriverSignup';
import AdminLogin from './components/auth/AdminLogin';
import AdminSignup from './components/auth/AdminSignup';
import PublicInterface from './components/public/PublicInterface';
import DriverDashboard from './components/driver/DriverDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import ProfileDropdown from './components/layout/ProfileDropdown';
import UserProfileModal from './components/shared/UserProfileModal';
import ChangePasswordModal from './components/shared/ChangePasswordModal';
import EnvironmentSetupModal from './components/shared/EnvironmentSetupModal';
import { DebugPanel } from './components/shared/DebugPanel';
import { auth } from './utils/auth';
import { getSupabaseClient } from './utils/supabase/client';
import { Settings, Home } from 'lucide-react';

type Page =
  | 'landing'
  | 'login-portal'
  | 'user-login'
  | 'user-signup'
  | 'driver-login'
  | 'driver-signup'
  | 'admin-login'
  | 'admin-signup'
  | 'public'
  | 'driver'
  | 'admin';

interface AuthState {
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: 'user' | 'driver' | 'admin' | null;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [authState, setAuthState] = useState<AuthState>({
    userId: null, userEmail: null, userName: null, userRole: null,
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showEnvSetupModal, setShowEnvSetupModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Session check on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasOAuthParams = urlParams.has('code') || window.location.hash.includes('access_token');

      if (hasOAuthParams) {
        try {
          const response = await auth.handleGoogleCallback();
          if (response?.user) {
            setAuthState({ userId: response.user.id, userEmail: response.user.email, userName: response.user.name, userRole: response.user.role });
            navigateByRole(response.user.role);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('[App] OAuth callback error:', error);
          setAuthError('Error handling Google OAuth callback');
        }
        setIsCheckingAuth(false);
        return;
      }

      const user = await auth.getCurrentUser();
      if (user) {
        setAuthState({ userId: user.id, userEmail: user.email, userName: user.name, userRole: user.role });
        navigateByRole(user.role);
      }
      setIsCheckingAuth(false);
    };

    checkSession();
  }, []);

  // ── Auth state listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAuthState({ userId: null, userEmail: null, userName: null, userRole: null });
        setCurrentPage('login-portal');
      }
    });

    const handleAuthExpired = () => {
      setAuthState({ userId: null, userEmail: null, userName: null, userRole: null });
      setCurrentPage('login-portal');
    };
    const handleAuthConfigError = (event: any) => {
      setAuthError(event.detail?.message || 'Configuration error');
      setShowEnvSetupModal(true);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    window.addEventListener('auth-config-error', handleAuthConfigError);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth-expired', handleAuthExpired);
      window.removeEventListener('auth-config-error', handleAuthConfigError);
    };
  }, []);

  // ── Helper ────────────────────────────────────────────────────────────────────
  const navigateByRole = (role: 'user' | 'driver' | 'admin' | null) => {
    if (role === 'user') setCurrentPage('public');
    else if (role === 'driver') setCurrentPage('driver');
    else if (role === 'admin') setCurrentPage('admin');
  };

  // ── Auth handlers ─────────────────────────────────────────────────────────────
  const handleUserLogin = async (userId: string, email: string) => {
    const user = await auth.getCurrentUser();
    setAuthState({ userId, userEmail: email, userName: user?.name || null, userRole: 'user' });
    setCurrentPage('public');
  };

  const handleUserSignup = async (userId: string, email: string) => {
    const user = await auth.getCurrentUser();
    setAuthState({ userId, userEmail: email, userName: user?.name || null, userRole: 'user' });
    setCurrentPage('public');
  };

  const handleDriverLogin = async (driverId: string) => {
    const user = await auth.getCurrentUser();
    setAuthState({ userId: driverId, userEmail: user?.email || null, userName: user?.name || null, userRole: 'driver' });
    setCurrentPage('driver');
  };

  const handleDriverSignup = async (userId: string) => {
    const user = await auth.getCurrentUser();
    setAuthState({ userId: user?.id || userId, userEmail: user?.email || null, userName: user?.name || null, userRole: 'driver' });
    setCurrentPage('driver');
  };

  const handleAdminLogin = async (adminId: string) => {
    const user = await auth.getCurrentUser();
    setAuthState({ userId: adminId, userEmail: user?.email || null, userName: user?.name || null, userRole: 'admin' });
    setCurrentPage('admin');
  };

  const handleAdminSignup = async (adminId: string) => {
    const user = await auth.getCurrentUser();
    setAuthState({ userId: adminId, userEmail: user?.email || null, userName: user?.name || null, userRole: 'admin' });
    setCurrentPage('admin');
  };

  const handleLogout = async () => {
    await auth.signOut();
    setAuthState({ userId: null, userEmail: null, userName: null, userRole: null });
    setCurrentPage('landing');
  };

  const handleNavigate = (page: 'public' | 'driver-login' | 'admin-login') => {
    if (page === 'public') {
      if (!authState.userId || authState.userRole !== 'user') setCurrentPage('user-login');
      else setCurrentPage('public');
    } else if (page === 'driver-login') {
      setCurrentPage('driver-login');
    } else if (page === 'admin-login') {
      setCurrentPage('admin-login');
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Public (unauthenticated) routes ───────────────────────────────────────────
  if (currentPage === 'landing')
    return <LandingPage onNavigate={handleNavigate} onShowLoginPortal={() => setCurrentPage('login-portal')} />;

  if (currentPage === 'login-portal')
    return (
      <LoginPortalSelector
        onSelectPortal={(portal) => {
          if (portal === 'user') setCurrentPage('user-login');
          else if (portal === 'driver') setCurrentPage('driver-login');
          else setCurrentPage('admin-login');
        }}
        onBack={() => setCurrentPage('landing')}
      />
    );

  if (currentPage === 'user-login')
    return <UserLogin onLogin={handleUserLogin} onBack={() => setCurrentPage('login-portal')} onSwitchToSignup={() => setCurrentPage('user-signup')} />;

  if (currentPage === 'user-signup')
    return <UserSignup onSignup={handleUserSignup} onSwitchToLogin={() => setCurrentPage('user-login')} onBack={() => setCurrentPage('user-login')} />;

  if (currentPage === 'driver-login')
    return <DriverLogin onLogin={handleDriverLogin} onBack={() => setCurrentPage('login-portal')} onSwitchToSignup={() => setCurrentPage('driver-signup')} />;

  if (currentPage === 'driver-signup')
    return <DriverSignup onSignup={handleDriverSignup} onSwitchToLogin={() => setCurrentPage('driver-login')} onBack={() => setCurrentPage('driver-login')} />;

  if (currentPage === 'admin-login')
    return <AdminLogin onLogin={handleAdminLogin} onBack={() => setCurrentPage('login-portal')} onSwitchToSignup={() => setCurrentPage('admin-signup')} />;

  if (currentPage === 'admin-signup')
    return <AdminSignup onSignup={handleAdminSignup} onSwitchToLogin={() => setCurrentPage('admin-login')} onBack={() => setCurrentPage('admin-login')} />;

  // ── Guard: redirect if not authenticated ──────────────────────────────────────
  if (!authState.userId) {
    setCurrentPage('login-portal');
    return null;
  }

  // ── Authenticated shell ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={() => setCurrentPage('landing')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Transit Tracker</h1>
                <p className="text-xs text-gray-500">
                  {currentPage === 'public' && `Public View · ${authState.userName || authState.userEmail}`}
                  {currentPage === 'driver' && `Driver Portal · ${authState.userName}`}
                  {currentPage === 'admin' && `Admin Dashboard · ${authState.userName}`}
                </p>
              </div>
            </button>

            {/* Navigation Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage('landing')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>

              <ProfileDropdown
                userRole={authState.userRole!}
                userId={authState.userId!}
                userEmail={authState.userEmail}
                onLogout={handleLogout}
                onViewProfile={() => setShowProfileModal(true)}
                onChangePassword={() => setShowPasswordModal(true)}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {currentPage === 'public' && authState.userRole === 'user' && <PublicInterface />}
        {currentPage === 'driver' && authState.userRole === 'driver' && (
          <DriverDashboard driverId={authState.userId!} userName={authState.userName || undefined} />
        )}
        {currentPage === 'admin' && authState.userRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Modals */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userRole={authState.userRole!}
        userId={authState.userId!}
        onUpdateProfile={async () => {
          const user = await auth.getCurrentUser();
          if (user) setAuthState(prev => ({ ...prev, userName: user.name }));
        }}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userRole={authState.userRole!}
        userId={authState.userId!}
      />

      <EnvironmentSetupModal
        isOpen={showEnvSetupModal}
        onClose={() => setShowEnvSetupModal(false)}
        error={authError || undefined}
      />

      {showDebugPanel && <DebugPanel onClose={() => setShowDebugPanel(false)} />}

      {/* Floating Debug Button */}
      <button
        onClick={() => setShowDebugPanel(true)}
        className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full shadow-lg transition-colors z-40 group"
        title="Open Debug Panel"
      >
        <Settings className="w-5 h-5" />
        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Debug Panel
        </span>
      </button>
    </div>
  );
}
