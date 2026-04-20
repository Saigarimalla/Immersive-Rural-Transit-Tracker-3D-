import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export interface Bus {
  id: string;
  number: string;
  routeId: string;
  routeName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  speed: number;
  heading: number;
  occupancy: string;
  capacity: number;
  currentPassengers: number;
  status: string;
  lastUpdated: string;
}

export interface Route {
  id: string;
  name: string;
  color: string;
  stops: string[];
}

export interface Stop {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export function useBusTracking(refreshInterval: number = 5000) {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [busesData, routesData, stopsData] = await Promise.all([
        api.getBuses(),
        api.getRoutes(),
        api.getStops(),
      ]);

      setBuses(busesData.buses || []);
      setRoutes(routesData.routes || []);
      setStops(stopsData.stops || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch bus tracking data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    buses,
    routes,
    stops,
    loading,
    error,
    refetch: fetchData,
  };
}
