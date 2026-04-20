import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import OpenStreetMap from '../public/OpenStreetMap';
import { api } from '../../utils/api';
import { Bus } from '../../types';

export default function AdminLiveTracking() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      setError(null);
      
      const [busesRes, routesRes, stopsRes] = await Promise.all([
        api.getBuses(),
        api.getRoutes(),
        api.getStops(),
      ]);

      setBuses(busesRes.buses || []);
      setRoutes(routesRes.routes || []);
      setStops(stopsRes.stops || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error loading tracking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracking data');
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Live Bus Tracking</h1>
            <p className="text-gray-600">Real-time vehicle locations and status</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-700">Auto-refresh (10s)</span>
            </label>
            <button
              onClick={handleManualRefresh}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Now
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {buses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center text-gray-500">
          <p>No active buses to track. Create buses in the Bus Management section.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
            <OpenStreetMap buses={buses} routes={routes} stops={stops} highContrast={false} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {buses.map(bus => {
              const route = routes.find(r => r.id === bus.routeId);
              const nextStop = stops.find(s => s.id === bus.nextStopId);
              
              return (
                <div key={bus.id} className="bg-white rounded-lg shadow-md p-4 border-l-4" style={{ borderLeftColor: route?.color || '#6B7280' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900">{bus.id}</div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      bus.occupancy === 'Low' ? 'bg-green-100 text-green-700' :
                      bus.occupancy === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {bus.occupancy}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Route:</span>
                      <span className="ml-2 font-medium" style={{ color: route?.color || '#6B7280' }}>{route?.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Next Stop:</span>
                      <span className="ml-2 font-medium text-gray-900">{nextStop?.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ETA:</span>
                      <span className="ml-2 font-medium text-gray-900">{bus.eta} min</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Speed:</span>
                      <span className="ml-2 font-medium text-gray-900">{Math.round(bus.speed || 0)} mph</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Last update: {new Date(bus.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}