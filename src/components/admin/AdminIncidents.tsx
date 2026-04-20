import React, { useState } from 'react';
import { Filter, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { incidents as initialIncidents, buses, routes } from '../../data/mockData';
import { Incident } from '../../types';

export default function AdminIncidents() {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const handleStatusChange = (id: string, newStatus: Incident['status']) => {
    setIncidents(incidents.map(inc => 
      inc.id === id ? { ...inc, status: newStatus } : inc
    ));
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filterStatus !== 'all' && inc.status !== filterStatus) return false;
    if (filterPriority !== 'all' && inc.priority !== filterPriority) return false;
    return true;
  });

  const statusCounts = {
    open: incidents.filter(i => i.status === 'open').length,
    inProgress: incidents.filter(i => i.status === 'in-progress').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Incident Management</h1>
        <p className="text-gray-600">Monitor and resolve reported issues</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-gray-900">{statusCounts.open}</div>
              <div className="text-sm text-gray-600">Open Incidents</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-gray-900">{statusCounts.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-gray-900">{statusCounts.resolved}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredIncidents.length} of {incidents.length} incidents
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map(incident => {
          const bus = buses.find(b => b.id === incident.busId);
          const route = routes.find(r => r.id === incident.routeId);
          
          return (
            <div key={incident.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      incident.priority === 'high' ? 'bg-red-100' :
                      incident.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        incident.priority === 'high' ? 'text-red-600' :
                        incident.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{incident.type.toUpperCase()}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          incident.priority === 'high' ? 'bg-red-100 text-red-700' :
                          incident.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {incident.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{incident.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>ID: {incident.id}</span>
                        {bus && <span>Bus {bus.id.replace('bus', '')}</span>}
                        {route && (
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: route.color }}></div>
                            {route.name}
                          </span>
                        )}
                        <span>Reported by: {incident.reportedBy} ({incident.reporterType})</span>
                        <span>{incident.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <select
                    value={incident.status}
                    onChange={(e) => handleStatusChange(incident.id, e.target.value as Incident['status'])}
                    className={`px-3 py-2 border-2 rounded-lg font-medium text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                      incident.status === 'open' ? 'border-red-300 bg-red-50 text-red-700' :
                      incident.status === 'in-progress' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                      'border-green-300 bg-green-50 text-green-700'
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {incident.status === 'resolved' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>This incident has been resolved</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredIncidents.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No incidents found</h3>
            <p className="text-gray-600">No incidents match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
