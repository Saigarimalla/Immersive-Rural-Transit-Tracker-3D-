import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';

export default function DataInitializer() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleInitialize = async () => {
    setIsInitializing(true);
    setStatus('idle');
    setMessage('');
    try {
      const response = await api.initDemoData();
      setStatus('success');
      const summary = response.summary;
      setMessage(`Transit system initialized! Created ${summary.buses} buses, ${summary.routes} routes, and ${summary.stops} bus stops.`);
    } catch (error) {
      console.error('Failed to initialize transit system:', error);
      setStatus('error');
      setMessage(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Database className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">Initialize Transit System</h3>
          <p className="text-sm text-blue-700 mb-3">
            Click the button below to initialize buses, routes, and bus stops for the transit system. Driver accounts will be created separately by administrators.
          </p>
          <button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            {isInitializing ? 'Initializing...' : 'Initialize Data'}
          </button>

          {status === 'success' && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
