import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, UserPlus, Copy, Check, Clock } from 'lucide-react';
import { api } from '../../utils/api';
import { Bus, DriverInvite, RouteSchedule } from '../../types';
import DataInitializer from '../shared/DataInitializer';

export default function AdminBusManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverInvites, setDriverInvites] = useState<DriverInvite[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Bus>>({});
  const [inviteFormData, setInviteFormData] = useState<Partial<DriverInvite>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [busesRes, routesRes, stopsRes, driversRes, invitesRes] = await Promise.all([
        api.getBuses(),
        api.getRoutes(),
        api.getStops(),
        api.getDrivers(),
        api.getDriverInvites()
      ]);

      setBuses(busesRes.buses || []);
      setRoutes(routesRes.routes || []);
      setStops(stopsRes.stops || []);
      setDrivers(driversRes.drivers || []);
      setDriverInvites(invitesRes.invites || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      
      // Don't continue if session expired - the app will redirect to login
      if (err instanceof Error && err.message.includes('session has expired')) {
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bus: Bus) => {
    setEditingId(bus.id);
    setFormData(bus);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const updatedBus = { ...formData, id: editingId } as Bus;
        await api.updateBus(updatedBus);
      } else {
        const newBus: Partial<Bus> = {
          busNumber: formData.busNumber,
          routeId: formData.routeId || (routes[0]?.id || 'route1'),
          lat: formData.lat || 12.9766,
          lng: formData.lng || 77.5718,
          occupancy: formData.occupancy || 'Low',
          speed: formData.speed || 0,
          heading: formData.heading || 0,
          nextStopId: formData.nextStopId || (stops[0]?.id || 'stop1'),
          eta: formData.eta || 5,
          driverId: formData.driverId,
          capacity: formData.capacity,
          schedule: formData.schedule || [],
          active: true,
        };
        await api.createBus(newBus);
      }
      
      await loadData();
      setEditingId(null);
      setShowAddForm(false);
      setFormData({});
    } catch (err) {
      console.error('Error saving bus:', err);
      alert('Failed to save bus: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bus?')) {
      try {
        await api.deleteBus(id);
        await loadData();
      } catch (err) {
        console.error('Error deleting bus:', err);
        alert('Failed to delete bus: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({});
  };

  const handleInviteDriver = () => {
    setShowInviteForm(true);
  };

  const handleInviteSave = async () => {
    try {
      const newInvite: Partial<DriverInvite> = {
        email: inviteFormData.email,
        name: inviteFormData.name,
        busId: inviteFormData.busId,
      };
      await api.createDriverInvite(newInvite);
      
      await loadData();
      setShowInviteForm(false);
      setInviteFormData({});
    } catch (err) {
      console.error('Error inviting driver:', err);
      alert('Failed to invite driver: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleInviteCancel = () => {
    setShowInviteForm(false);
    setInviteFormData({});
  };

  const handleDeleteInvite = async (id: string) => {
    if (confirm('Are you sure you want to delete this driver invite?')) {
      try {
        await api.deleteDriverInvite(id);
        await loadData();
      } catch (err) {
        console.error('Error deleting invite:', err);
        alert('Failed to delete invite: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  const handleCopyId = (id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).catch(() => fallbackCopy(id));
      } else {
        fallbackCopy(id);
      }
    } catch {
      fallbackCopy(id);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fallbackCopy = (text: string) => {
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

  const addScheduleStop = () => {
    const schedule = formData.schedule || [];
    schedule.push({ stopId: '', arrivalTime: '' });
    setFormData({ ...formData, schedule });
  };

  const updateScheduleStop = (index: number, field: keyof RouteSchedule, value: string) => {
    const schedule = [...(formData.schedule || [])];
    schedule[index] = { ...schedule[index], [field]: value };
    setFormData({ ...formData, schedule });
  };

  const removeScheduleStop = (index: number) => {
    const schedule = [...(formData.schedule || [])];
    schedule.splice(index, 1);
    setFormData({ ...formData, schedule });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Bus Management</h1>
          <p className="text-gray-600">Add, edit, and manage fleet vehicles</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Bus
          </button>
          <button
            onClick={handleInviteDriver}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite Driver
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold mb-1">Error loading data</p>
          <p className="text-sm">{error}</p>
          {error.includes('Unauthorized') && (
            <p className="text-sm mt-2">
              Please make sure you're logged in as an admin. Try logging out and logging back in.
            </p>
          )}
        </div>
      )}

      {routes.length === 0 && (
        <div>
          <DataInitializer />
        </div>
      )}

      {/* Driver Invites Section */}
      {driverInvites.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Driver Invites</h3>
          <div className="space-y-3">
            {driverInvites.map(invite => {
              const bus = buses.find(b => b.id === invite.busId);
              return (
                <div key={invite.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-lg font-semibold text-blue-900">{invite.id}</div>
                      {invite.claimed && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Claimed
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {invite.email && <span>Email: {invite.email} • </span>}
                      {invite.name && <span>Name: {invite.name} • </span>}
                      {bus ? `Bus: ${bus.busNumber || bus.id}` : 'No bus assigned'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyId(invite.id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      {copiedId === invite.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy ID
                        </>
                      )}
                    </button>
                    {!invite.claimed && (
                      <button
                        onClick={() => handleDeleteInvite(invite.id)}
                        className="p-2 text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Bus Form */}
      {(showAddForm || editingId) && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Bus' : 'Add New Bus'}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bus Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Number / ID *
                </label>
                <input
                  type="text"
                  value={formData.busNumber || ''}
                  onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g., BUS-101, Route-5A"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passenger Capacity *
                </label>
                <input
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g., 40"
                />
              </div>

              {/* Route */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route *</label>
                <select
                  value={formData.routeId || ''}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Select route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>{route.name}</option>
                  ))}
                </select>
              </div>

              {/* Next Stop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Starting Stop *</label>
                <select
                  value={formData.nextStopId || ''}
                  onChange={(e) => setFormData({ ...formData, nextStopId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Select stop</option>
                  {stops.map(stop => (
                    <option key={stop.id} value={stop.id}>{stop.name}</option>
                  ))}
                </select>
              </div>

              {/* ETA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default ETA (minutes)</label>
                <input
                  type="number"
                  value={formData.eta || 5}
                  onChange={(e) => setFormData({ ...formData, eta: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Occupancy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Occupancy</label>
                <select
                  value={formData.occupancy || 'Low'}
                  onChange={(e) => setFormData({ ...formData, occupancy: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="Low">Low (0-30%)</option>
                  <option value="Medium">Medium (30-70%)</option>
                  <option value="High">High (70-100%)</option>
                </select>
              </div>
            </div>

            {/* Route Schedule */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Route Schedule / Timings
                </label>
                <button
                  onClick={addScheduleStop}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                >
                  + Add Stop Time
                </button>
              </div>
              {(formData.schedule || []).length === 0 ? (
                <p className="text-sm text-gray-500 italic">No schedule defined yet. Click "Add Stop Time" to add timings.</p>
              ) : (
                <div className="space-y-2">
                  {(formData.schedule || []).map((scheduleItem, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={scheduleItem.stopId}
                        onChange={(e) => updateScheduleStop(index, 'stopId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                      >
                        <option value="">Select stop</option>
                        {stops.map(stop => (
                          <option key={stop.id} value={stop.id}>{stop.name}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={scheduleItem.arrivalTime}
                        onChange={(e) => updateScheduleStop(index, 'arrivalTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                        placeholder="08:30"
                      />
                      <button
                        onClick={() => removeScheduleStop(index)}
                        className="p-2 text-red-600 hover:text-red-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={!formData.busNumber || !formData.routeId || !formData.nextStopId || !formData.capacity}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save Bus
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Driver Form */}
      {showInviteForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Generate Driver Invite
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Create a unique Driver ID that can be used by a driver to register and access their assigned bus.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver Name (Optional)</label>
              <input
                type="text"
                value={inviteFormData.name || ''}
                onChange={(e) => setInviteFormData({ ...inviteFormData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver Email (Optional)</label>
              <input
                type="email"
                value={inviteFormData.email || ''}
                onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="driver@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Bus *</label>
              <select
                value={inviteFormData.busId || ''}
                onChange={(e) => setInviteFormData({ ...inviteFormData, busId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select bus</option>
                {buses.map(bus => {
                  const route = routes.find(r => r.id === bus.routeId);
                  return (
                    <option key={bus.id} value={bus.id}>
                      {bus.busNumber || bus.id} - {route?.name || 'Unknown route'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleInviteSave}
              disabled={!inviteFormData.busId}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Generate Invite
            </button>
            <button
              onClick={handleInviteCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bus List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {buses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No buses found. Add your first bus to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupancy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {buses.map(bus => {
                  const route = routes.find(r => r.id === bus.routeId);
                  const driver = drivers.find(d => d.userId === bus.driverId || d.id === bus.driverId);
                  
                  return (
                    <tr key={bus.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{bus.busNumber || bus.id}</div>
                        {bus.schedule && bus.schedule.length > 0 && (
                          <div className="text-xs text-gray-500">{bus.schedule.length} scheduled stops</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: route?.color || '#gray' }}></div>
                          <span className="text-sm text-gray-900">{route?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bus.capacity || 'N/A'} seats</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{driver?.name || 'Unassigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          bus.occupancy === 'Low' ? 'bg-green-100 text-green-800' :
                          bus.occupancy === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bus.occupancy}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          (bus.speed || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(bus.speed || 0) > 0 ? 'Active' : 'Idle'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(bus)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bus.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}