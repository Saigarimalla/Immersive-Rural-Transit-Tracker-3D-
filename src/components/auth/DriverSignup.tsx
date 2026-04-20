import React, { useState } from 'react';
import { Users, Mail, Lock, ArrowRight, AlertCircle, User, Key } from 'lucide-react';
import { auth } from '../../utils/auth';
import { api } from '../../utils/api';

interface DriverSignupProps {
  onSignup: (driverId: string) => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

export default function DriverSignup({ onSignup, onSwitchToLogin, onBack }: DriverSignupProps) {
  const [step, setStep] = useState<'verify' | 'register'>('verify');
  const [formData, setFormData] = useState({ driverId: '', name: '', email: '', password: '', confirmPassword: '' });
  const [verifiedInvite, setVerifiedInvite] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleVerifyDriverId = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.driverId.trim()) {
      setError('Please enter your Driver ID');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.verifyDriverInvite(formData.driverId.trim());
      setVerifiedInvite(response.invite);
      if (response.invite.email) setFormData(prev => ({ ...prev, email: response.invite.email }));
      if (response.invite.name) setFormData(prev => ({ ...prev, name: response.invite.name }));
      setStep('register');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Driver ID verification error:', err);
      setError(err.message || 'Invalid Driver ID. Please check with your administrator.');
      setIsLoading(false);
    }
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
      const response = await auth.signUp(formData.email, formData.password, formData.name, 'driver');
      await api.claimDriverInvite(formData.driverId, response.user.id);
      onSignup(response.user.id);
    } catch (err: any) {
      console.error('Driver signup error:', err);
      setError(err.message || 'Failed to create driver account. Please try again.');
      setIsLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-9 h-9 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Driver Registration</h1>
            <p className="text-gray-600">Enter your unique Driver ID to get started</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleVerifyDriverId} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Driver ID *</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                    placeholder="DRV-XXXXXXXX"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">This unique ID was provided by your administrator when they assigned you to a bus.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Verifying...</span></>
                ) : (
                  <><span>Verify Driver ID</span><ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="text-green-600 hover:text-green-700 font-medium">Sign in here</button>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Registration</h1>
          <p className="text-gray-600">Driver ID verified! Create your account</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Driver ID: {formData.driverId}</span>
          </div>
          {verifiedInvite?.busId && (
            <p className="text-xs text-green-700 mt-1">You will be assigned to bus: {verifiedInvite.busId}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'Full Name', name: 'name', type: 'text', icon: User, placeholder: 'John Doe' },
              { label: 'Email Address', name: 'email', type: 'email', icon: Mail, placeholder: 'john@example.com' },
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Creating Account...</span></>
              ) : (
                <><span>Create Driver Account</span><ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-green-600 hover:text-green-700 font-medium">Sign in here</button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <button onClick={() => setStep('verify')} className="text-gray-600 hover:text-gray-900 transition-colors">← Change Driver ID</button>
        </div>
      </div>
    </div>
  );
}
