import React, { useState } from 'react';
import { X, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { auth } from '../../utils/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'user' | 'driver' | 'admin';
  userId: string;
}

export default function ChangePasswordModal({ isOpen, onClose, userRole, userId }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess(false);
  };

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await auth.changePassword(formData.newPassword);
      setSuccess(true);
      setFormData({ newPassword: '', confirmPassword: '' });
      setTimeout(() => { onClose(); setSuccess(false); }, 2000);
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess(false);
    setShowPasswords({ new: false, confirm: false });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Update your password to keep your account secure</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Password changed successfully!</span>
            </div>
          )}

          {[
            { label: 'New Password', name: 'newPassword', field: 'new' as const, helper: 'Minimum 6 characters' },
            { label: 'Confirm New Password', name: 'confirmPassword', field: 'confirm' as const },
          ].map(({ label, name, field, helper }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords[field] ? 'text' : 'password'}
                  name={name}
                  value={(formData as any)[name]}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={field === 'new' ? 'Enter new password' : 'Re-enter new password'}
                  required
                />
                <button type="button" onClick={() => togglePasswordVisibility(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPasswords[field] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading || success} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Changing...</>
              ) : (
                <><Lock className="w-5 h-5" />Change Password</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
