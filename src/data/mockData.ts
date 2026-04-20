import { BusStop, Route, Bus, Driver, Incident, Message } from '../types';

// Bus stops in Bangalore, India
export const busStops: BusStop[] = [
  { id: 'stop1', name: 'Majestic Bus Station', lat: 12.9766, lng: 77.5718, routes: ['route1', 'route2'] },
  { id: 'stop2', name: 'MG Road Junction', lat: 12.9716, lng: 77.5946, routes: ['route1'] },
  { id: 'stop3', name: 'Indiranagar Metro', lat: 12.9784, lng: 77.6408, routes: ['route1', 'route3'] },
  { id: 'stop4', name: 'Victoria Hospital', lat: 12.9698, lng: 77.5802, routes: ['route2'] },
  { id: 'stop5', name: 'Commercial Street', lat: 12.9826, lng: 77.6089, routes: ['route2', 'route3'] },
  { id: 'stop6', name: 'Koramangala', lat: 12.9352, lng: 77.6245, routes: ['route3'] },
  { id: 'stop7', name: 'Cubbon Park', lat: 12.9762, lng: 77.5929, routes: ['route1', 'route2'] },
  { id: 'stop8', name: 'Electronic City', lat: 12.8456, lng: 77.6603, routes: ['route3'] },
];

export const routes: Route[] = [
  {
    id: 'route1',
    name: 'City Center Loop',
    color: '#3B82F6',
    stops: ['stop1', 'stop2', 'stop3', 'stop7'],
    active: true,
  },
  {
    id: 'route2',
    name: 'Hospital Express',
    color: '#10B981',
    stops: ['stop1', 'stop4', 'stop5', 'stop7'],
    active: true,
  },
  {
    id: 'route3',
    name: 'IT Corridor Route',
    color: '#F59E0B',
    stops: ['stop3', 'stop5', 'stop6', 'stop8'],
    active: true,
  },
];

// Buses operating in Bangalore, India
export const buses: Bus[] = [
  {
    id: 'bus1',
    routeId: 'route1',
    lat: 12.9750,
    lng: 77.5850,
    occupancy: 'Medium',
    speed: 25,
    heading: 45,
    nextStopId: 'stop2',
    eta: 3,
    driverId: 'driver1',
    lastUpdated: new Date(),
  },
  {
    id: 'bus2',
    routeId: 'route2',
    lat: 12.9720,
    lng: 77.5820,
    occupancy: 'High',
    speed: 15,
    heading: 90,
    nextStopId: 'stop4',
    eta: 5,
    driverId: 'driver2',
    lastUpdated: new Date(),
  },
  {
    id: 'bus3',
    routeId: 'route3',
    lat: 12.9600,
    lng: 77.6300,
    occupancy: 'Low',
    speed: 30,
    heading: 180,
    nextStopId: 'stop6',
    eta: 7,
    driverId: 'driver3',
    lastUpdated: new Date(),
  },
  {
    id: 'bus4',
    routeId: 'route1',
    lat: 12.9780,
    lng: 77.6200,
    occupancy: 'Low',
    speed: 28,
    heading: 270,
    nextStopId: 'stop3',
    eta: 4,
    driverId: 'driver4',
    lastUpdated: new Date(),
  },
];

export const drivers: Driver[] = [
  { id: 'driver1', name: 'Rajesh Kumar', busId: 'bus1', email: 'r.kumar@transit.in', phone: '+91-98765-43210' },
  { id: 'driver2', name: 'Priya Sharma', busId: 'bus2', email: 'p.sharma@transit.in', phone: '+91-98765-43211' },
  { id: 'driver3', name: 'Arjun Reddy', busId: 'bus3', email: 'a.reddy@transit.in', phone: '+91-98765-43212' },
  { id: 'driver4', name: 'Sneha Patel', busId: 'bus4', email: 's.patel@transit.in', phone: '+91-98765-43213' },
  { id: 'driver5', name: 'Vikram Singh', email: 'v.singh@transit.in', phone: '+91-98765-43214' },
];

export const incidents: Incident[] = [
  {
    id: 'inc1',
    type: 'delay',
    busId: 'bus2',
    routeId: 'route2',
    reportedBy: 'driver2',
    reporterType: 'driver',
    description: 'Heavy traffic near Victoria Hospital causing 10-minute delay',
    status: 'in-progress',
    timestamp: new Date(Date.now() - 15 * 60000),
    priority: 'medium',
  },
  {
    id: 'inc2',
    type: 'complaint',
    busId: 'bus1',
    routeId: 'route1',
    reportedBy: 'passenger_anonymous',
    reporterType: 'passenger',
    description: 'Bus arrived 5 minutes late at MG Road Junction',
    status: 'open',
    timestamp: new Date(Date.now() - 45 * 60000),
    priority: 'low',
  },
  {
    id: 'inc3',
    type: 'breakdown',
    busId: 'bus3',
    routeId: 'route3',
    reportedBy: 'driver3',
    reporterType: 'driver',
    description: 'Engine warning light - requesting maintenance check',
    status: 'resolved',
    timestamp: new Date(Date.now() - 120 * 60000),
    priority: 'high',
  },
];

export const messages: Message[] = [
  {
    id: 'msg1',
    from: 'driver2',
    fromType: 'driver',
    to: 'admin',
    content: 'Need assistance with traffic delay on Route 2',
    timestamp: new Date(Date.now() - 20 * 60000),
    read: false,
  },
  {
    id: 'msg2',
    from: 'admin',
    fromType: 'admin',
    to: 'driver1',
    content: 'Please confirm occupancy update at Majestic Bus Station',
    timestamp: new Date(Date.now() - 60 * 60000),
    read: true,
  },
];
