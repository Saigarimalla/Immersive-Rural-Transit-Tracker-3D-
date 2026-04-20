import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Mail, Phone, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';
import { Driver } from '../../types';

export default function AdminDriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Driver>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [driversRes, busesRes] = await Promise.all([
        api.getDrivers(),
        api.getBuses(),
      ]);

      setDrivers(driversRes.drivers || []);
      setBuses(busesRes.buses || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setFormData(driver);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Update existing driver
        const updatedDriver = { ...formData, id: editingId } as Driver;
        await api.updateDriver(updatedDriver);
      } else {
        // Create new driver
        const newDriver: Partial<Driver> = {
          name: formData.name || '',
          busId: formData.busId,
          email: formData.email || '',
          phone: formData.phone || '',
        };
        await api.createDriver(newDriver);
      }
      
      await loadData();
      setEditingId(null);
      setShowAddForm(false);
      setFormData({});
    } catch (err) {
      console.error('Error saving driver:', err);
      alert('Failed to save driver: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      try {
        await api.deleteDriver(id);
        await loadData();
      } catch (err) {
        console.error('Error deleting driver:', err);
        alert('Failed to delete driver: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({});
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Driver Management</h1>
          <p className="text-gray-600">Manage driver profiles and bus assignments</p>
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
            Add New Driver
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Driver' : 'Add New Driver'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Bus</label>
              <select
                value={formData.busId || ''}
                onChange={(e) => setFormData({ ...formData, busId: e.target.value || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {buses.map(bus => (
                  <option key={bus.id} value={bus.id}>{bus.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="driver@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="+1-234-567-8900"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={!formData.name || !formData.email}
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

      {/* Driver Grid */}
      {drivers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center text-gray-500">
          <p>No drivers found. Add your first driver to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map(driver => {
            const assignedBus = buses.find(b => b.id === driver.busId);
            
            return (
              <div key={driver.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-purple-600">
                          {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{driver.name}</h3>
                        <p className="text-xs text-purple-100">{driver.id}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(driver)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span>{driver.email}</span>
                  </div>
                  
                  {driver.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span>{driver.phone}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-500 mb-1">Assigned Bus:</div>
                    {assignedBus ? (
                      <div className="px-3 py-2 bg-purple-50 rounded-lg text-sm font-medium text-purple-700">
                        {assignedBus.id}
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-500 italic">
                        Not assigned
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
