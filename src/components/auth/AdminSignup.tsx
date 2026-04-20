import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, User } from 'lucide-react';
import { auth } from '../../utils/auth';

interface AdminSignupProps {
  onSignup: (adminId: string) => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

export default function AdminSignup({ onSignup, onSwitchToLogin, onBack }: AdminSignupProps) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      const response = await auth.signUp(formData.email, formData.password, formData.name, 'admin');
      onSignup(response.user.id);
    } catch (err: any) {
      console.error('Admin signup error:', err);
      setError(err.message || 'Failed to create admin account. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Registration</h1>
          <p className="text-gray-600">Create your admin account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'Full Name', name: 'name', type: 'text', icon: User, placeholder: 'John Doe' },
              { label: 'Email Address', name: 'email', type: 'email', icon: Mail, placeholder: 'admin@example.com' },
              { label: 'Password', name: 'password', type: 'password', icon: Lock, placeholder: '••••••••', helper: 'Minimum 6 characters' },
              { label: 'Confirm Password', name: 'confirmPassword', type: 'password', icon: Lock, placeholder: '••••••••' },
            ].map(({ label, name, type, icon: Icon, placeholder, helper }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label} *</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={type}
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={placeholder}
                    required
                  />
                </div>
                {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
              </div>
            ))}

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Creating Account...</span></>
              ) : (
                <><span>Create Admin Account</span><ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-purple-600 hover:text-purple-700 font-medium">Sign in here</button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900 transition-colors">← Back to portal selection</button>
        </div>
      </div>
    </div>
  );
}
