import React from 'react';
import { MapPin, Bus, Users, BarChart3, Shield, Clock, Smartphone, Globe, ArrowRight, CheckCircle, LogIn, Zap, Target, Heart } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

interface LandingPageProps {
  onNavigate: (page: 'public' | 'driver-login' | 'admin-login') => void;
  onShowLoginPortal: () => void;
}

export default function LandingPage({ onNavigate, onShowLoginPortal }: LandingPageProps) {
  const features = [
    {
      icon: MapPin,
      title: 'Real-Time Tracking',
      description: 'Track buses in real-time with GPS-based location updates every 30 seconds',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Clock,
      title: 'Accurate ETAs',
      description: 'Get predicted arrival times at each bus stop based on live traffic conditions',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: Users,
      title: 'Occupancy Indicators',
      description: 'See bus capacity levels to plan your journey better',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: Globe,
      title: '3D Visualization',
      description: 'Toggle between 2D maps and interactive 3D views',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Fully responsive design works seamlessly on all devices',
      color: 'from-pink-500 to-pink-600',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights on ridership and performance',
      color: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
  ];

  const benefits = [
    'Multiple route support with color-coded visualization',
    'Incident reporting and real-time notifications',
    'Driver management and fleet monitoring',
    'WCAG compliant with accessibility features',
    'High-contrast mode for better visibility',
    'Role-based access control for security',
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime', icon: Zap },
    { value: '24/7', label: 'Support', icon: Target },
    { value: '1000+', label: 'Happy Riders', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_10px_40px_rgba(59,130,246,0.3)] transition-all duration-500 group-hover:shadow-[0_20px_60px_rgba(59,130,246,0.4)] group-hover:scale-110 group-hover:-translate-y-1 transform-gpu">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-purple-700 rounded-2xl translate-y-1 -z-10" />
                <Bus className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Transit Tracker
                </h1>
                <p className="text-xs text-gray-600 font-medium">Smart Rural Transit</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <Button
                onClick={onShowLoginPortal}
                variant="primary"
                size="md"
                rightIcon={<LogIn className="w-5 h-5" />}
                className="relative shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.4)] transition-all duration-300 hover:-translate-y-0.5"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full mb-8 shadow-[0_8px_30px_rgba(59,130,246,0.15)] border border-blue-100 hover:shadow-[0_12px_40px_rgba(59,130,246,0.25)] transition-all duration-300 hover:-translate-y-0.5">
                <span className="w-2.5 h-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Real-Time Bus Tracking Platform
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                    Immersive Rural
                  </span>
                </span>
                <br />
                <span className="relative inline-block">Transit Tracker</span>
              </h1>

              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Experience the future of public transportation with real-time GPS tracking,
                interactive 3D maps, and intelligent arrival predictions designed for rural communities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                  <Button
                    onClick={onShowLoginPortal}
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />}
                    className="relative shadow-[0_15px_50px_rgba(59,130,246,0.3)] hover:shadow-[0_20px_60px_rgba(59,130,246,0.4)] transition-all duration-300 hover:-translate-y-1"
                  >
                    Start Tracking Buses
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline"
                  size="lg"
                  className="shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Learn More
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-16">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="relative group cursor-pointer" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl translate-y-2 opacity-50 group-hover:translate-y-3 transition-transform duration-300" />
                    <div className="relative bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_45px_rgba(0,0,0,0.12)] transition-all duration-300 group-hover:-translate-y-1 border border-gray-100">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stat.value}</div>
                      <div className="text-sm text-gray-600 font-medium mt-1">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Isometric illustration */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[600px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-96 h-96">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl transform rotate-45 scale-110 blur-2xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="relative group">
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/10 rounded-full blur-xl" />
                        <div className="relative w-40 h-40">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-gradient-to-br from-blue-500 to-blue-600 transform -skew-x-12 shadow-2xl rounded-t-xl" />
                          <div className="absolute top-8 left-0 w-16 h-24 bg-gradient-to-br from-blue-600 to-blue-700 transform -skew-y-12 shadow-xl" />
                          <div className="absolute top-8 right-0 w-16 h-24 bg-gradient-to-br from-blue-400 to-blue-500 transform skew-y-12 shadow-xl" />
                          <div className="absolute top-10 left-4 w-4 h-4 bg-white/80 transform -skew-y-12 rounded-sm" />
                          <div className="absolute top-16 left-4 w-4 h-4 bg-white/80 transform -skew-y-12 rounded-sm" />
                          <div className="absolute -bottom-2 left-2 w-6 h-6 bg-gray-800 rounded-full shadow-lg border-2 border-gray-600" />
                          <div className="absolute -bottom-2 right-2 w-6 h-6 bg-gray-800 rounded-full shadow-lg border-2 border-gray-600" />
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded-full shadow-lg text-xs font-bold text-blue-600 whitespace-nowrap">
                            Route 1
                          </div>
                        </div>
                        <div className="absolute -top-12 -right-8 animate-bounce">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-[0_10px_40px_rgba(239,68,68,0.4)] flex items-center justify-center">
                              <MapPin className="w-7 h-7 text-white" />
                            </div>
                            <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75" />
                          </div>
                        </div>
                        <div className="absolute -top-4 -left-8 w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg" />
                        <div className="absolute top-8 -right-12 w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300 shadow-lg" />
                        <div className="absolute -bottom-6 -left-4 w-2.5 h-2.5 bg-pink-400 rounded-full animate-pulse delay-700 shadow-lg" />
                      </div>
                    </div>
                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 400">
                      <defs>
                        <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="50%" stopColor="#9333EA" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                      <path d="M 100 200 Q 200 100 300 200" stroke="url(#hero-gradient)" strokeWidth="4" fill="none" strokeDasharray="10 5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(59 130 246) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features for Modern Transit</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mt-6">
              Everything you need to track, manage, and optimize public transportation
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="relative group cursor-pointer" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl translate-y-2 translate-x-2 opacity-40 group-hover:translate-y-3 group-hover:translate-x-3 transition-all duration-300" />
                <div className="relative bg-white p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 ${feature.iconBg} rounded-2xl blur-md opacity-50 scale-110`} />
                    <div className={`relative w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  <div className={`absolute -bottom-10 -right-10 w-20 h-20 bg-gradient-to-br ${feature.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full mb-6">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-semibold">Trusted & Secure</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose Transit Tracker?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Built with modern technology and designed specifically for rural and small-city transit systems.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3 group">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-700 font-medium">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Card hover padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">For Commuters</h3>
                    <p className="text-gray-600 mb-4">Track your bus in real-time and never miss your ride</p>
                    <Button onClick={() => onNavigate('public')} variant="secondary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Track Buses
                    </Button>
                  </div>
                </div>
              </Card>

              <Card hover padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">For Drivers</h3>
                    <p className="text-gray-600 mb-4">Update status and manage your route efficiently</p>
                    <Button onClick={() => onNavigate('driver-login')} variant="secondary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Driver Portal
                    </Button>
                  </div>
                </div>
              </Card>

              <Card hover padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">For Administrators</h3>
                    <p className="text-gray-600 mb-4">Manage fleet, routes, and analyze performance</p>
                    <Button onClick={() => onNavigate('admin-login')} variant="secondary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Admin Dashboard
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to Transform Your Commute?</h2>
          <p className="text-xl text-white/90 mb-10">Join thousands of riders experiencing smarter, more reliable public transit</p>
          <Button
            onClick={onShowLoginPortal}
            variant="secondary"
            size="lg"
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="!bg-white !text-blue-600 hover:!bg-gray-50 !shadow-2xl"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Transit Tracker</h3>
                <p className="text-sm text-gray-400">Smart Rural Transit</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">© 2024 Transit Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
