import React, { useState } from 'react';
import { LayoutDashboard, Map, Bus, Users, Route as RouteIcon, AlertTriangle, BarChart3, Settings } from 'lucide-react';
import AdminOverview from './AdminOverview';
import AdminLiveTracking from './AdminLiveTracking';
import AdminBusManagement from './AdminBusManagement';
import AdminRouteManagement from './AdminRouteManagement';
import AdminDriverManagement from './AdminDriverManagement';
import AdminIncidents from './AdminIncidents';
import AdminAnalytics from './AdminAnalytics';

type AdminView = 'overview' | 'tracking' | 'buses' | 'routes' | 'drivers' | 'incidents' | 'analytics';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<AdminView>('overview');

  const menuItems = [
    { id: 'overview' as AdminView, label: 'Overview', icon: LayoutDashboard },
    { id: 'tracking' as AdminView, label: 'Live Tracking', icon: Map },
    { id: 'buses' as AdminView, label: 'Bus Management', icon: Bus },
    { id: 'routes' as AdminView, label: 'Route Management', icon: RouteIcon },
    { id: 'drivers' as AdminView, label: 'Driver Management', icon: Users },
    { id: 'incidents' as AdminView, label: 'Incidents', icon: AlertTriangle },
    { id: 'analytics' as AdminView, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Admin Panel</h3>
              <p className="text-xs text-gray-500">System Management</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'overview' && <AdminOverview />}
        {activeView === 'tracking' && <AdminLiveTracking />}
        {activeView === 'buses' && <AdminBusManagement />}
        {activeView === 'routes' && <AdminRouteManagement />}
        {activeView === 'drivers' && <AdminDriverManagement />}
        {activeView === 'incidents' && <AdminIncidents />}
        {activeView === 'analytics' && <AdminAnalytics />}
      </div>
    </div>
  );
}
