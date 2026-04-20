import React, { useState } from 'react';
import { MapPin, Mail, Lock, ArrowRight, AlertCircle, User, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Card } from '../ui/Card';
import { auth } from '../../utils/auth';

interface UserSignupProps {
  onSignup: (userId: string, email: string) => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

export default function UserSignup({ onSignup, onSwitchToLogin, onBack }: UserSignupProps) {
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
      const response = await auth.signUp(formData.email, formData.password, formData.name, 'user');
      onSignup(response.user.id, response.user.email);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/30">
              <MapPin className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Create Account</h1>
          <p className="text-lg text-gray-600">Join us to start tracking buses</p>
        </div>

        <Card padding="lg" className="shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input type="text" name="name" label="Full Name" value={formData.name} onChange={handleChange} leftIcon={<User className="w-5 h-5" />} placeholder="John Doe" required />
            <Input type="email" name="email" label="Email Address" value={formData.email} onChange={handleChange} leftIcon={<Mail className="w-5 h-5" />} placeholder="john@example.com" required />
            <Input type="password" name="password" label="Password" value={formData.password} onChange={handleChange} leftIcon={<Lock className="w-5 h-5" />} placeholder="Minimum 6 characters" helperText="Minimum 6 characters" required />
            <Input type="password" name="confirmPassword" label="Confirm Password" value={formData.confirmPassword} onChange={handleChange} leftIcon={<Lock className="w-5 h-5" />} placeholder="Re-enter password" required />

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} rightIcon={!isLoading && <ArrowRight className="w-5 h-5" />}>
              {!isLoading && 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline">
                Sign in here
              </button>
            </p>
          </div>
        </Card>

        <div className="text-center mt-6">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to portal selection
          </button>
        </div>
      </div>
    </div>
  );
}
