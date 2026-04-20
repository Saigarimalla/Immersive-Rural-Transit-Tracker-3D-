import React from 'react';
import { MapPin, Users, Shield, ArrowRight } from 'lucide-react';

interface LoginPortalSelectorProps {
  onSelectPortal: (portal: 'user' | 'driver' | 'admin') => void;
  onBack: () => void;
}

export default function LoginPortalSelector({ onSelectPortal, onBack }: LoginPortalSelectorProps) {
  const portals = [
    {
      id: 'user' as const,
      title: 'Public User',
      description: 'Track buses in real-time, view schedules, and plan your journey',
      icon: MapPin,
      gradient: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
    },
    {
      id: 'driver' as const,
      title: 'Bus Driver',
      description: 'Update your location, report incidents, and manage occupancy',
      icon: Users,
      gradient: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
    },
    {
      id: 'admin' as const,
      title: 'Administrator',
      description: 'Manage fleet, routes, drivers, and view analytics',
      icon: Shield,
      gradient: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Select Login Portal</h1>
          <p className="text-xl text-gray-600">Choose your role to access the system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <button
                key={portal.id}
                onClick={() => onSelectPortal(portal.id)}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-gray-200 group text-left"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${portal.gradient} rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{portal.title}</h3>
                <p className="text-gray-600 mb-6">{portal.description}</p>
                <div className={`flex items-center gap-2 ${portal.textColor} font-semibold group-hover:gap-3 transition-all`}>
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
