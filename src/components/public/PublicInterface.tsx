import React, { useState, useEffect, useMemo } from 'react';
import { Bus, Moon, Sun, MessageCircle, Filter, Map as MapIcon, Box, RefreshCw, Clock, Users, MapPin, TrendingUp } from 'lucide-react';
import OpenStreetMap from './OpenStreetMap';
import ThreeDView from './ThreeDView';
import ChatSupport from './ChatSupport';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { api } from '../../utils/api';
import { Bus as BusType, Route } from '../../types';
import { useBusSimulation } from '../../hooks/useBusSimulation';

export default function PublicInterface() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [busStops, setBusStops] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [selectedBus, setSelectedBus] = useState<string>('all');
  const [highContrast, setHighContrast] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const interval = setInterval(() => { loadData(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [busesRes, routesRes, stopsRes] = await Promise.all([
        api.getBuses(),
        api.getRoutes(),
        api.getStops(),
      ]);
      setBuses(busesRes.buses || []);
      setRoutes(routesRes.routes || []);
      setBusStops(stopsRes.stops || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredBuses = useMemo(() => buses.filter(bus => {
    if (selectedRoute !== 'all' && bus.routeId !== selectedRoute) return false;
    if (selectedBus !== 'all' && bus.id !== selectedBus) return false;
    return true;
  }), [buses, selectedRoute, selectedBus]);

  const activeRoutes = useMemo(() => routes.filter(route =>
    selectedRoute === 'all' || route.id === selectedRoute
  ), [routes, selectedRoute]);

  const animatedBuses = useBusSimulation(filteredBuses, activeRoutes, busStops);

  const stats = {
    activeBuses: filteredBuses.length,
    avgEta: Math.round(filteredBuses.reduce((sum, bus) => sum + bus.eta, 0) / filteredBuses.length),
    lowOccupancy: filteredBuses.filter(b => b.occupancy === 'Low').length,
    onTime: filteredBuses.filter(b => b.eta <= 5).length,
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      highContrast ? 'bg-black text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Control Panel */}
      <div className={`sticky top-0 z-40 backdrop-blur-xl border-b shadow-sm transition-colors duration-300 ${
        highContrast ? 'bg-gray-900/95 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${highContrast ? 'bg-gray-800' : 'bg-blue-50'}`}>
                <Filter className={`w-5 h-5 ${highContrast ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm font-semibold ${highContrast ? 'text-blue-400' : 'text-blue-900'}`}>Filters</span>
              </div>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all duration-300 ${
                  highContrast ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 hover:border-blue-400'
                } focus:ring-4 focus:ring-blue-100 focus:outline-none`}
              >
                <option value="all">All Routes</option>
                {routes.map(route => <option key={route.id} value={route.id}>{route.name}</option>)}
              </select>
              <select
                value={selectedBus}
                onChange={(e) => setSelectedBus(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all duration-300 ${
                  highContrast ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 hover:border-blue-400'
                } focus:ring-4 focus:ring-blue-100 focus:outline-none`}
              >
                <option value="all">All Buses</option>
                {buses.map(bus => <option key={bus.id} value={bus.id}>Bus {bus.id.replace('bus', '')}</option>)}
              </select>
            </div>

            {/* View Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex rounded-xl p-1 shadow-sm ${highContrast ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {[{ mode: '2d' as const, icon: MapIcon, label: '2D Map' }, { mode: '3d' as const, icon: Box, label: '3D View' }].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all duration-300 ${
                      viewMode === mode
                        ? highContrast ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 shadow-md'
                        : highContrast ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all duration-300 flex items-center gap-2 ${
                  highContrast ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                } disabled:opacity-50`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all duration-300 flex items-center gap-2 ${
                  highContrast ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span className="hidden sm:inline">High Contrast</span>
              </button>

              <Button onClick={() => setShowChat(!showChat)} variant="primary" size="md" leftIcon={<MessageCircle className="w-4 h-4" />}>
                <span className="hidden sm:inline">Support</span>
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Active Buses', value: stats.activeBuses, icon: Bus, color: 'blue' },
              { label: 'Avg ETA', value: `${stats.avgEta || 0} min`, icon: Clock, color: 'green' },
              { label: 'Low Occupancy', value: stats.lowOccupancy, icon: Users, color: 'purple' },
              { label: 'On Time', value: stats.onTime, icon: TrendingUp, color: 'orange' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${highContrast ? 'bg-gray-800' : `bg-${color}-50`}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${highContrast ? `bg-${color}-900` : `bg-${color}-100`}`}>
                  <Icon className={`w-5 h-5 ${highContrast ? `text-${color}-400` : `text-${color}-600`}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${highContrast ? 'text-white' : 'text-gray-900'}`}>{value}</div>
                  <div className={`text-xs font-medium ${highContrast ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-3 flex items-center gap-3 text-sm ${highContrast ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">Live</span>
            </div>
            <span className="opacity-50">•</span>
            <span>Updated {lastUpdate.toLocaleTimeString()}</span>
            <span className="opacity-50">•</span>
            <span className="font-medium">{filteredBuses.length} bus{filteredBuses.length !== 1 ? 'es' : ''} tracked</span>
          </div>
        </div>
      </div>

      {/* Bus Status Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${highContrast ? 'text-white' : 'text-gray-900'}`}>Active Buses</h2>
          <p className={`text-sm ${highContrast ? 'text-gray-400' : 'text-gray-600'}`}>Track all buses in real-time with live updates every 30 seconds</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {filteredBuses.length === 0 ? (
            <div className="col-span-full">
              <div className={`p-12 text-center rounded-2xl border-2 ${highContrast ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                <Bus className={`w-16 h-16 mx-auto mb-4 ${highContrast ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${highContrast ? 'text-white' : 'text-gray-900'}`}>No Active Buses</h3>
                <p className={`text-sm ${highContrast ? 'text-gray-400' : 'text-gray-600'}`}>
                  {buses.length === 0
                    ? 'The system administrator needs to add buses to the fleet.'
                    : 'No buses match your current filters. Try adjusting the filters above.'}
                </p>
              </div>
            </div>
          ) : (
            filteredBuses.map(bus => {
              const route = routes.find(r => r.id === bus.routeId);
              const nextStop = busStops.find(s => s.id === bus.nextStopId);
              return (
                <div
                  key={bus.id}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                    highContrast ? 'bg-gray-800 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: route?.color }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: route?.color }}>
                          <Bus className="w-6 h-6" />
                        </div>
                        <div>
                          <div className={`font-bold text-lg ${highContrast ? 'text-white' : 'text-gray-900'}`}>Bus {bus.id.replace('bus', '')}</div>
                          <div className={`text-xs font-medium ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>{route?.name}</div>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        bus.occupancy === 'Low' ? 'bg-green-100 text-green-700' :
                        bus.occupancy === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{bus.occupancy}</div>
                    </div>
                    <div className="space-y-3">
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${highContrast ? 'bg-gray-900' : 'bg-gray-50'}`}>
                        <MapPin className={`w-4 h-4 flex-shrink-0 ${highContrast ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium ${highContrast ? 'text-gray-400' : 'text-gray-600'}`}>Next Stop</div>
                          <div className={`font-semibold truncate ${highContrast ? 'text-white' : 'text-gray-900'}`}>{nextStop?.name}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`p-2 rounded-lg ${highContrast ? 'bg-gray-900' : 'bg-blue-50'}`}>
                          <div className={`text-xs font-medium mb-1 ${highContrast ? 'text-gray-400' : 'text-blue-600'}`}>ETA</div>
                          <div className={`text-lg font-bold ${highContrast ? 'text-blue-400' : 'text-blue-600'}`}>{bus.eta} min</div>
                        </div>
                        <div className={`p-2 rounded-lg ${highContrast ? 'bg-gray-900' : 'bg-gray-50'}`}>
                          <div className={`text-xs font-medium mb-1 ${highContrast ? 'text-gray-400' : 'text-gray-600'}`}>Speed</div>
                          <div className={`text-lg font-bold ${highContrast ? 'text-white' : 'text-gray-900'}`}>{Math.round(bus.speed)} mph</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Map / 3D View */}
        <div className="mb-6">
          <div className={`flex items-center justify-between mb-4 p-4 rounded-xl ${highContrast ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
            <div>
              <h2 className={`text-2xl font-bold ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                {viewMode === '2d' ? 'OpenStreetMap 2D View' : '3D View'}
              </h2>
              <p className={`text-sm ${highContrast ? 'text-gray-400' : 'text-gray-600'}`}>Real-time bus tracking with route visualization</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold ${highContrast ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-700'}`}>
              {viewMode.toUpperCase()} Mode
            </div>
          </div>

          <div className={`rounded-2xl overflow-hidden border-2 shadow-xl ${highContrast ? 'border-gray-700' : 'border-gray-200'}`}>
            {viewMode === '2d' ? (
              <OpenStreetMap buses={animatedBuses} routes={activeRoutes} stops={busStops} highContrast={highContrast} />
            ) : (
              <ThreeDView buses={animatedBuses} routes={activeRoutes} stops={busStops} highContrast={highContrast} />
            )}
          </div>
        </div>
      </div>

      {showChat && <ChatSupport onClose={() => setShowChat(false)} highContrast={highContrast} />}
    </div>
  );
}
