import { X, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface EnvironmentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  error?: string;
}

export default function EnvironmentSetupModal({ isOpen, onClose, error }: EnvironmentSetupModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const supabaseUrl = `https://${projectId}.supabase.co`;

  const copyToClipboard = (text: string, field: string) => {
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(textarea);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    } catch { fallbackCopy(); }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const envVars = [
    { name: 'SUPABASE_URL', value: supabaseUrl, description: 'Your Supabase project URL' },
    { name: 'SUPABASE_ANON_KEY', value: publicAnonKey, description: 'Your Supabase anonymous (public) key' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Environment Configuration Required</h2>
              <p className="text-sm text-gray-600 mt-1">Your Supabase Edge Function needs environment variables configured</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900">Error Details:</p>
              <p className="text-sm text-red-700 mt-1 font-mono">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What's Wrong?</h3>
            <p className="text-sm text-gray-700">
              The authentication server (Supabase Edge Function) doesn't have the correct environment variables configured.
              This causes "Invalid JWT" errors when trying to authenticate users.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">How to Fix This:</h3>
            <ol className="space-y-4">
              {[
                {
                  num: 1, title: 'Open Supabase Dashboard',
                  body: <p className="text-sm text-gray-600 mt-1">Go to <a href={`https://supabase.com/dashboard/project/${projectId}/functions`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">your project's Edge Functions page</a></p>
                },
                {
                  num: 2, title: 'Navigate to Environment Variables',
                  body: <p className="text-sm text-gray-600 mt-1">Click on "Edge Functions" in the sidebar, then click "Manage environment variables"</p>
                },
                {
                  num: 3, title: 'Add/Update These Environment Variables:',
                  body: (
                    <div className="space-y-3 mt-3">
                      {envVars.map((envVar) => (
                        <div key={envVar.name} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-900">{envVar.name}</p>
                            <button
                              onClick={() => copyToClipboard(envVar.value, envVar.name)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              {copiedField === envVar.name ? <><CheckCircle className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{envVar.description}</p>
                          <div className="bg-white border border-gray-300 rounded p-2">
                            <code className="text-xs text-gray-800 break-all font-mono">{envVar.value}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  num: 4, title: 'Redeploy the Edge Function',
                  body: <p className="text-sm text-gray-600 mt-1">After setting the environment variables, you may need to redeploy the "make-server-e128d165" edge function</p>
                },
                {
                  num: 5, title: 'Verify & Retry',
                  body: <p className="text-sm text-gray-600 mt-1">Close this dialog and try logging in again. You can also open the Debug Panel (⚙️ button) to verify the configuration</p>
                },
              ].map(({ num, title, body }) => (
                <li key={num} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">{num}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{title}</p>
                    {body}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">📝 Note:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>SUPABASE_SERVICE_ROLE_KEY should already be configured automatically by Supabase</li>
              <li>Make sure to use the exact values shown above (copy button recommended)</li>
              <li>Changes may take a minute to propagate after deployment</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <a href={`https://supabase.com/dashboard/project/${projectId}/functions`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-medium">
            Open Supabase Dashboard →
          </a>
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
            I'll Configure This Later
          </button>
        </div>
      </div>
    </div>
  );
}
