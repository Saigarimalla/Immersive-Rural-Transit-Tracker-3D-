import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, Lock, LogOut, ChevronDown, Mail, Phone, Shield, IdCard } from 'lucide-react';

interface ProfileDropdownProps {
  userRole: 'user' | 'driver' | 'admin';
  userId: string;
  userEmail: string | null;
  onLogout: () => void;
  onViewProfile: () => void;
  onChangePassword: () => void;
}

export default function ProfileDropdown({
  userRole,
  userId,
  userEmail,
  onLogout,
  onViewProfile,
  onChangePassword,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getUserDetails = () => {
    if (userRole === 'user') {
      const users = JSON.parse(localStorage.getItem('transit_users') || '[]');
      return users.find((u: any) => u.id === userId);
    } else if (userRole === 'driver') {
      const drivers = JSON.parse(localStorage.getItem('transit_drivers') || '[]');
      return drivers.find((d: any) => d.id === userId);
    } else {
      const admins = JSON.parse(localStorage.getItem('transit_admins') || '[]');
      return admins.find((a: any) => a.id === userId);
    }
  };

  const userDetails = getUserDetails();
  const displayName = userDetails?.name || 'User';
  const displayEmail = userDetails?.email || userEmail || 'No email';

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleConfig = () => {
    switch (userRole) {
      case 'user':
        return { bgColor: 'bg-blue-100', textColor: 'text-blue-700', gradientFrom: 'from-blue-500', gradientTo: 'to-blue-600', label: 'Public User' };
      case 'driver':
        return { bgColor: 'bg-green-100', textColor: 'text-green-700', gradientFrom: 'from-green-500', gradientTo: 'to-green-600', label: 'Driver' };
      case 'admin':
        return { bgColor: 'bg-purple-100', textColor: 'text-purple-700', gradientFrom: 'from-purple-500', gradientTo: 'to-purple-600', label: 'Administrator' };
    }
  };

  const config = getRoleConfig();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className={`w-9 h-9 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} rounded-full flex items-center justify-center text-white font-semibold shadow-md`}>
          {getInitials(displayName)}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">{displayName}</div>
          <div className={`text-xs ${config.textColor}`}>{config.label}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          <div className={`p-4 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-white/50">
                {getInitials(displayName)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{displayName}</h3>
                <p className="text-xs text-white/90 truncate">{displayEmail}</p>
                {userRole === 'driver' && (
                  <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                    <IdCard className="w-3 h-3" />
                    {userId}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="space-y-2 text-xs">
              {userDetails?.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{userDetails.phone}</span>
                </div>
              )}
              {userRole === 'admin' && userDetails?.username && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-3.5 h-3.5" />
                  <span>@{userDetails.username}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500">
                <span className={`px-2 py-0.5 ${config.bgColor} ${config.textColor} rounded-full text-xs font-medium`}>
                  {config.label}
                </span>
              </div>
            </div>
          </div>

          <div className="py-2">
            {[
              { icon: User, label: 'My Profile', sub: 'View and edit your information', action: onViewProfile },
              { icon: Lock, label: 'Change Password', sub: 'Update your password', action: onChangePassword },
              { icon: Settings, label: 'Account Settings', sub: 'Manage your preferences', action: onViewProfile },
            ].map(({ icon: Icon, label, sub, action }) => (
              <button
                key={label}
                onClick={() => { setIsOpen(false); action(); }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
              >
                <Icon className="w-4 h-4" />
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-gray-500">{sub}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 py-2">
            <button
              onClick={() => { setIsOpen(false); onLogout(); }}
              className="w-full px-4 py-2.5 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <div>
                <div className="text-sm font-medium">Logout</div>
                <div className="text-xs text-red-500">Sign out of your account</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
