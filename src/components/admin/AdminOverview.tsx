import React from 'react';
import { Bus, Users, Route, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { buses, routes, drivers, incidents } from '../../data/mockData';

export default function AdminOverview() {
  const activeBuses = buses.filter(b => b.speed > 0).length;
  const activeRoutes = routes.filter(r => r.active).length;
  const activeDrivers = drivers.filter(d => d.busId).length;
  const openIncidents = incidents.filter(i => i.status !== 'resolved').length;

  const stats = [
    {
      label: 'Active Buses',
      value: activeBuses,
      total: buses.length,
      icon: Bus,
      color: 'blue',
      change: '+2 from yesterday',
    },
    {
      label: 'Active Routes',
      value: activeRoutes,
      total: routes.length,
      icon: Route,
      color: 'green',
      change: 'All operational',
    },
    {
      label: 'On-Duty Drivers',
      value: activeDrivers,
      total: drivers.length,
      icon: Users,
      color: 'purple',
      change: `${drivers.length - activeDrivers} available`,
    },
    {
      label: 'Open Incidents',
      value: openIncidents,
      total: incidents.length,
      icon: AlertCircle,
      color: 'red',
      change: `${incidents.length - openIncidents} resolved`,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">System Overview</h1>
        <p className="text-gray-600">Real-time transit system status and metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            purple: 'bg-purple-500',
            red: 'bg-red-500',
          };

          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${colorClasses[stat.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">of {stat.total}</div>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">{stat.label}</h3>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Incidents</h3>
          <div className="space-y-3">
            {incidents.slice(0, 3).map(incident => (
              <div key={incident.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  incident.priority === 'high' ? 'bg-red-500' :
                  incident.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900">{incident.type.toUpperCase()}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      incident.status === 'open' ? 'bg-red-100 text-red-700' :
                      incident.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {incident.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{incident.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {incident.timestamp.toLocaleString()} - {incident.reportedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status</h3>
          <div className="space-y-4">
            {buses.map(bus => {
              const route = routes.find(r => r.id === bus.routeId);
              const driver = drivers.find(d => d.busId === bus.id);
              
              return (
                <div key={bus.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: route?.color }}
                    >
                      <Bus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">Bus {bus.id.replace('bus', '')}</div>
                      <div className="text-xs text-gray-600">{driver?.name || 'Unassigned'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs mb-1 ${
                      bus.occupancy === 'Low' ? 'bg-green-100 text-green-700' :
                      bus.occupancy === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {bus.occupancy}
                    </div>
                    <div className="text-xs text-gray-500">{Math.round(bus.speed)} mph</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">GPS Tracking</div>
              <div className="text-sm text-green-600">Operational</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Communication</div>
              <div className="text-sm text-green-600">All systems online</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Performance</div>
              <div className="text-sm text-green-600">98% uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
