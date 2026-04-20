import React, { useState, useEffect } from 'react';
import { Bus, AlertTriangle, MapPin, Users, Clock, Play, Square, Navigation } from 'lucide-react';
import { api } from '../../utils/api';
import { Incident } from '../../types';

interface DriverDashboardProps {
  driverId: string;
  userName?: string;
}

export default function DriverDashboard({ driverId, userName }: DriverDashboardProps) {
  const [myBus, setMyBus] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [nextStop, setNextStop] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentType, setIncidentType] = useState<'delay' | 'breakdown' | 'other'>('delay');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [isTripActive, setIsTripActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDriverData();
    return () => {
      if (locationUpdateInterval) clearInterval(locationUpdateInterval);
    };
  }, [driverId]);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [busesRes, routesRes, stopsRes] = await Promise.all([
        api.getBuses(),
        api.getRoutes(),
        api.getStops(),
      ]);
      const assignedBus = busesRes.buses?.find((b: any) => b.driverId === driverId);
      if (!assignedBus) {
        setError('No bus assigned to you yet. Please contact your administrator to get a bus assignment.');
        setLoading(false);
        return;
      }
      setMyBus(assignedBus);
      setOccupancy(assignedBus.occupancy || 'Low');
      setIsTripActive(assignedBus.active && (assignedBus.speed || 0) > 0);
      const busRoute = routesRes.routes?.find((r: any) => r.id === assignedBus.routeId);
      setRoute(busRoute);
      setStops(stopsRes.stops || []);
      if (assignedBus.nextStopId) {
        const stop = stopsRes.stops?.find((s: any) => s.id === assignedBus.nextStopId);
        setNextStop(stop);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading driver data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }
  };

  const startTrip = () => {
    setIsTripActive(true);
    const interval = setInterval(() => { updateLocation(); }, 30000);
    setLocationUpdateInterval(interval);
  };

  const endTrip = () => {
    setIsTripActive(false);
    if (locationUpdateInterval) { clearInterval(locationUpdateInterval); setLocationUpdateInterval(null); }
  };

  const updateLocation = async () => {
    if (!myBus) return;
    try {
      const newLat = myBus.lat + (Math.random() - 0.5) * 0.002;
      const newLng = myBus.lng + (Math.random() - 0.5) * 0.002;
      const newSpeed = isTripActive ? Math.random() * 30 + 10 : 0;
      const newHeading = Math.random() * 360;
      await api.updateBusLocation(myBus.id, { lat: newLat, lng: newLng, speed: newSpeed, heading: newHeading });
      setMyBus({ ...myBus, lat: newLat, lng: newLng, speed: newSpeed, heading: newHeading });
    } catch (err) {
      console.error('Error updating location:', err);
    }
  };

  const handleOccupancyUpdate = async (newOccupancy: 'Low' | 'Medium' | 'High') => {
    if (!myBus) return;
    try {
      await api.updateBusOccupancy(myBus.id, newOccupancy);
      setOccupancy(newOccupancy);
      setMyBus({ ...myBus, occupancy: newOccupancy });
    } catch (err) {
      console.error('Error updating occupancy:', err);
      alert('Failed to update occupancy: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleReportIncident = async () => {
    if (!myBus || !incidentDescription.trim()) return;
    try {
      await api.createIncident({
        type: incidentType,
        busId: myBus.id,
        routeId: route?.id,
        reporterType: 'driver',
        description: incidentDescription,
        priority: incidentType === 'breakdown' ? 'high' : 'medium',
      });
      alert('Incident reported successfully!');
      setShowIncidentForm(false);
      setIncidentDescription('');
    } catch (err) {
      console.error('Error reporting incident:', err);
      alert('Failed to report incident: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !myBus || !route) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Bus Assignment</h2>
          <p className="text-gray-600">{error || 'You are not currently assigned to a bus.'}</p>
          <button onClick={loadDriverData} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white mb-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-1">Welcome, {userName || 'Driver'}!</h2>
          <p className="text-green-100">Driver ID: {driverId}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Control */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Control</h3>
              <div className="flex items-center gap-4">
                {!isTripActive ? (
                  <button onClick={startTrip} className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold">
                    <Play className="w-5 h-5" />Start Trip
                  </button>
                ) : (
                  <button onClick={endTrip} className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold">
                    <Square className="w-5 h-5" />End Trip
                  </button>
                )}
                <button onClick={updateLocation} disabled={!isTripActive} className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  <Navigation className="w-5 h-5" />Update Location
                </button>
              </div>
              {isTripActive && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Trip in progress - Location updates every 30 seconds
                </div>
              )}
            </div>

            {/* Bus & Route Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: route.color }}>
                  <Bus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{myBus.busNumber || myBus.id}</h3>
                  <p className="text-gray-600">{route.name}</p>
                  {myBus.capacity && <p className="text-sm text-gray-500">Capacity: {myBus.capacity} passengers</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">Next Stop</span>
                  </div>
                  <p className="font-semibold text-gray-900">{nextStop?.name || 'Unknown'}</p>
                  <p className="text-sm text-blue-600 mt-1">ETA: {myBus.eta || 0} min</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">Speed</span>
                  </div>
                  <p className="font-semibold text-gray-900">{Math.round(myBus.speed || 0)} mph</p>
                  <p className="text-sm text-green-600 mt-1">{isTripActive ? 'Active' : 'Idle'}</p>
                </div>
              </div>
            </div>

            {/* Occupancy Control */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Update Occupancy Status</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {([['Low', 'green', '0-30% full'], ['Medium', 'yellow', '30-70% full'], ['High', 'red', '70-100% full']] as const).map(([level, color, label]) => (
                  <button
                    key={level}
                    onClick={() => handleOccupancyUpdate(level)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      occupancy === level ? `border-${color}-500 bg-${color}-50 shadow-md` : `border-gray-200 hover:border-${color}-300`
                    }`}
                  >
                    <div className={`w-8 h-8 bg-${color}-500 rounded-full mx-auto mb-2`}></div>
                    <div className="text-center font-semibold">{level}</div>
                    <div className="text-xs text-gray-600 text-center mt-1">{label}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                Current status: <span className="font-semibold">{occupancy}</span>
              </div>
            </div>

            {/* Incident Reporting */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Report Incident</h3>
                </div>
                <button onClick={() => setShowIncidentForm(!showIncidentForm)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  {showIncidentForm ? 'Cancel' : 'New Report'}
                </button>
              </div>
              {showIncidentForm && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type</label>
                    <select value={incidentType} onChange={(e) => setIncidentType(e.target.value as any)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none">
                      <option value="delay">Traffic Delay</option>
                      <option value="breakdown">Vehicle Breakdown</option>
                      <option value="other">Other Issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea value={incidentDescription} onChange={(e) => setIncidentDescription(e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Describe the incident in detail..." />
                  </div>
                  <button onClick={handleReportIncident} disabled={!incidentDescription.trim()} className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Submit Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Stops on Route</span>
                  <span className="font-semibold text-blue-600">{route.stops.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Trip Status</span>
                  <span className="font-semibold text-green-600">{isTripActive ? 'Active' : 'Idle'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">Current Occupancy</span>
                  <span className="font-semibold text-purple-600">{occupancy}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Stops</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {route.stops.map((stopId: string, index: number) => {
                  const stop = stops.find(s => s.id === stopId);
                  const isNext = stopId === myBus.nextStopId;
                  const scheduleItem = myBus.schedule?.find((s: any) => s.stopId === stopId);
                  return (
                    <div key={stopId} className={`p-3 rounded-lg border-2 ${isNext ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-semibold" style={{ backgroundColor: route.color }}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{stop?.name || stopId}</div>
                          {scheduleItem && <div className="text-xs text-gray-600 mt-1">Scheduled: {scheduleItem.arrivalTime}</div>}
                          {isNext && <div className="text-xs text-green-600 font-medium">Next Stop</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
