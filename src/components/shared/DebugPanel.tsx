import { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface DebugPanelProps {
  onClose: () => void;
}

interface ServerConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  hasServiceRoleKey: boolean;
}

export function DebugPanel({ onClose }: DebugPanelProps) {
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServerConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e128d165/debug/config`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setServerConfig(data);
    } catch (err) {
      console.error('[DebugPanel] Error fetching server config:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch server config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServerConfig(); }, []);

  const checkConfig = (serverValue: string | undefined, frontendValue: string, label: string) => {
    if (!serverValue) {
      return (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-red-900">{label} - Missing</p>
            <p className="text-sm text-red-700 mt-1">Server has no value configured</p>
          </div>
        </div>
      );
    }
    const matches = serverValue === frontendValue;
    if (matches) {
      return (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-green-900">{label} - Match ✓</p>
            <p className="text-xs text-green-700 mt-1 font-mono break-all">{serverValue}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-yellow-900">{label} - Mismatch!</p>
          <div className="mt-2 space-y-2">
            <div>
              <p className="text-xs font-semibold text-yellow-800">Server:</p>
              <p className="text-xs text-yellow-700 font-mono break-all bg-yellow-100 p-1 rounded">{serverValue}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-yellow-800">Frontend:</p>
              <p className="text-xs text-yellow-700 font-mono break-all bg-yellow-100 p-1 rounded">{frontendValue}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Debug Panel</h2>
            <p className="text-sm text-gray-600 mt-1">Server Configuration Diagnostics</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchServerConfig} disabled={loading} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50" title="Refresh">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading server configuration...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Error Loading Configuration</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button onClick={fetchServerConfig} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && serverConfig && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Configuration Status</h3>
                <p className="text-sm text-blue-800">Compare server-side environment variables with frontend configuration. Mismatches will cause "Invalid JWT" errors.</p>
              </div>

              <div className="space-y-3">
                {checkConfig(serverConfig.SUPABASE_URL, `https://${projectId}.supabase.co`, 'SUPABASE_URL')}
                {checkConfig(serverConfig.SUPABASE_ANON_KEY, publicAnonKey, 'SUPABASE_ANON_KEY')}
                <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {serverConfig.hasServiceRoleKey ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">SUPABASE_SERVICE_ROLE_KEY - {serverConfig.hasServiceRoleKey ? 'Configured ✓' : 'Missing'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {serverConfig.hasServiceRoleKey ? 'Service role key is configured on the server' : 'Service role key is not configured (required for auth operations)'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Frontend Configuration</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Project ID:</p>
                    <p className="text-xs text-gray-600 font-mono break-all bg-white p-2 rounded border border-gray-200">{projectId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Supabase URL:</p>
                    <p className="text-xs text-gray-600 font-mono break-all bg-white p-2 rounded border border-gray-200">https://{projectId}.supabase.co</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Anon Key:</p>
                    <p className="text-xs text-gray-600 font-mono break-all bg-white p-2 rounded border border-gray-200">{publicAnonKey}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
