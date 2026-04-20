import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, Bus } from 'lucide-react';

export default function AdminAnalytics() {
  // Mock data for charts
  const occupancyData = [
    { route: 'Downtown Loop', low: 12, medium: 25, high: 18 },
    { route: 'Hospital Express', low: 8, medium: 30, high: 22 },
    { route: 'School & Market', low: 15, medium: 20, high: 10 },
  ];

  const peakHoursData = [
    { hour: '6 AM', passengers: 45 },
    { hour: '7 AM', passengers: 120 },
    { hour: '8 AM', passengers: 180 },
    { hour: '9 AM', passengers: 95 },
    { hour: '10 AM', passengers: 60 },
    { hour: '11 AM', passengers: 55 },
    { hour: '12 PM', passengers: 85 },
    { hour: '1 PM', passengers: 70 },
    { hour: '2 PM', passengers: 65 },
    { hour: '3 PM', passengers: 90 },
    { hour: '4 PM', passengers: 140 },
    { hour: '5 PM', passengers: 175 },
    { hour: '6 PM', passengers: 130 },
    { hour: '7 PM', passengers: 75 },
  ];

  const routePerformanceData = [
    { name: 'Downtown Loop', value: 35 },
    { name: 'Hospital Express', value: 40 },
    { name: 'School & Market', value: 25 },
  ];

  const weeklyTrendsData = [
    { day: 'Mon', ridership: 420, onTime: 95 },
    { day: 'Tue', ridership: 450, onTime: 92 },
    { day: 'Wed', ridership: 480, onTime: 94 },
    { day: 'Thu', ridership: 460, onTime: 96 },
    { day: 'Fri', ridership: 510, onTime: 93 },
    { day: 'Sat', ridership: 280, onTime: 97 },
    { day: 'Sun', ridership: 240, onTime: 98 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

  const metrics = [
    {
      id: 'ridership',
      label: 'Average Daily Ridership',
      value: '1,245',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'blue',
    },
    {
      id: 'ontime',
      label: 'On-Time Performance',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: Clock,
      color: 'green',
    },
    {
      id: 'fleet',
      label: 'Fleet Utilization',
      value: '87%',
      change: '+5%',
      trend: 'up',
      icon: Bus,
      color: 'purple',
    },
    {
      id: 'peak',
      label: 'Peak Capacity',
      value: '180',
      change: '-3%',
      trend: 'down',
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const colorClasses = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            purple: 'bg-purple-500',
            orange: 'bg-orange-500',
          };

          return (
            <div key={metric.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${colorClasses[metric.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change}
                </span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Peak Hours Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Travel Times</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={peakHoursData} id="peak-hours-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="hour" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="passengers"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Passengers"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4">
            Peak hours: 8:00 AM and 5:00 PM with highest passenger volume
          </p>
        </div>

        {/* Route Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart id="route-dist-chart">
              <Pie
                data={routePerformanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {routePerformanceData.map((entry, index) => (
                  <Cell key={`route-cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {routePerformanceData.map((route, index) => (
              <div key={`legend-${route.name}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-gray-700">{route.name}</span>
                </div>
                <span className="font-medium text-gray-900">{route.value}% of total</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Occupancy by Route */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Levels by Route</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyData} id="occupancy-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="route" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="low" stackId="occ" fill="#10B981" name="Low" radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" stackId="occ" fill="#F59E0B" name="Medium" radius={[0, 0, 0, 0]} />
              <Bar dataKey="high" stackId="occ" fill="#EF4444" name="High" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4">
            Hospital Express shows highest occupancy during peak hours
          </p>
        </div>

        {/* Weekly Trends */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyTrendsData} id="weekly-trends-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" stroke="#6B7280" />
              <YAxis yAxisId="ridership-axis" stroke="#6B7280" />
              <YAxis yAxisId="ontime-axis" orientation="right" stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                yAxisId="ridership-axis"
                type="monotone"
                dataKey="ridership"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                name="Ridership"
              />
              <Line
                yAxisId="ontime-axis"
                type="monotone"
                dataKey="onTime"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                name="On-Time %"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4">
            Weekday ridership peaks on Friday; Weekend shows best on-time performance
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-semibold text-blue-900 mb-2">Highest Demand</h4>
          <p className="text-sm text-blue-800">
            Hospital Express route shows consistent high demand during weekday mornings (7-9 AM)
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-semibold text-green-900 mb-2">Best Performance</h4>
          <p className="text-sm text-green-800">
            Weekend routes maintain 97%+ on-time performance with lower traffic volumes
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h4 className="font-semibold text-purple-900 mb-2">Optimization Opportunity</h4>
          <p className="text-sm text-purple-800">
            Consider adding buses to Hospital Express during 8 AM peak to reduce crowding
          </p>
        </div>
      </div>
    </div>
  );
}