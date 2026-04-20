import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';
import { Route } from '../../types';
import DataInitializer from '../shared/DataInitializer';

export default function AdminRouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Route>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [routesRes, stopsRes] = await Promise.all([
        api.getRoutes(),
        api.getStops(),
      ]);

      setRoutes(routesRes.routes || []);
      setStops(stopsRes.stops || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (route: Route) => {
    setEditingId(route.id);
    setFormData(route);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Update existing route
        const updatedRoute = { ...formData, id: editingId } as Route;
        await api.updateRoute(updatedRoute);
      } else {
        // Create new route
        const newRoute: Partial<Route> = {
          name: formData.name || 'New Route',
          color: formData.color || '#3B82F6',
          stops: formData.stops || [],
          active: formData.active !== undefined ? formData.active : true,
        };
        await api.createRoute(newRoute);
      }
      
      await loadData();
      setEditingId(null);
      setShowAddForm(false);
      setFormData({});
    } catch (err) {
      console.error('Error saving route:', err);
      alert('Failed to save route: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      try {
        await api.deleteRoute(id);
        await loadData();
      } catch (err) {
        console.error('Error deleting route:', err);
        alert('Failed to delete route: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({});
  };

  const toggleStop = (stopId: string) => {
    const currentStops = formData.stops || [];
    if (currentStops.includes(stopId)) {
      setFormData({ ...formData, stops: currentStops.filter(s => s !== stopId) });
    } else {
      setFormData({ ...formData, stops: [...currentStops, stopId] });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Route Management</h1>
          <p className="text-gray-600">Configure routes and stop sequences</p>
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
            Add New Route
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {routes.length === 0 && stops.length === 0 && (
        <div className="mb-6">
          <DataInitializer />
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Route' : 'Add New Route'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Route Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="e.g., Downtown Express"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Route Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Active Status</label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active !== undefined ? formData.active : true}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Route is active</span>
            </label>
          </div>

          {stops.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Stops (in order)</label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {stops.map(stop => (
                  <label key={stop.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.stops || []).includes(stop.id)}
                      onChange={() => toggleStop(stop.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{stop.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!formData.name}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save
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
      )}

      {/* Route List */}
      {routes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center text-gray-500">
          <p>No routes found. Add your first route to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {routes.map(route => (
            <div key={route.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6 border-l-4" style={{ borderLeftColor: route.color }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold" style={{ backgroundColor: route.color }}>
                      {route.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        route.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {route.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(route)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(route.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Route Details:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Color:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: route.color }}></div>
                        <span className="font-mono text-xs">{route.color}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Stops:</span>
                      <span className="ml-2 font-medium">{route.stops.length}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Stop Sequence:</div>
                  <div className="space-y-1">
                    {route.stops.map((stopId, index) => {
                      const stop = stops.find(s => s.id === stopId);
                      return (
                        <div key={stopId} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white" style={{ backgroundColor: route.color }}>
                            {index + 1}
                          </div>
                          <span className="text-gray-900">{stop?.name || stopId}</span>
                        </div>
                      );
                    })}
                    {route.stops.length === 0 && (
                      <p className="text-gray-500 text-sm italic">No stops assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}