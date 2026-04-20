import React, { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, Edit2, Save, AlertCircle } from 'lucide-react';
import { auth } from '../../utils/auth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'user' | 'driver' | 'admin';
  userId: string;
  onUpdateProfile: (updatedData: any) => void;
}

export default function UserProfileModal({ isOpen, onClose, userRole, userId, onUpdateProfile }: UserProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    if (isOpen) {
      auth.getCurrentUser().then(user => {
        setUserDetails(user);
        setFormData({ name: user?.name || '' });
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await auth.updateProfile(formData.name);
      onUpdateProfile(formData);
      setIsEditing(false);
      setUserDetails((prev: any) => ({ ...prev, name: formData.name }));
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const roleColors = { user: 'bg-blue-100 text-blue-800', driver: 'bg-green-100 text-green-800', admin: 'bg-purple-100 text-purple-800' };
  const roleLabels = { user: 'Commuter', driver: 'Driver', admin: 'Administrator' };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleColors[userRole]}`}>
            {roleLabels[userRole]}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg ${isEditing ? 'bg-white' : 'bg-gray-50'} focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" value={userDetails?.email || ''} disabled className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={userId} disabled className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-sm" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={() => { setIsEditing(false); setFormData({ name: userDetails?.name || '' }); setError(''); }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</>
                ) : (
                  <><Save className="w-5 h-5" />Save Changes</>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
