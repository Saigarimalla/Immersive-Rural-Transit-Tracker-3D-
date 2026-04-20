export interface Bus {
  id: string;
  busNumber?: string; // User-friendly bus number/identifier
  routeId: string;
  lat: number;
  lng: number;
  occupancy: 'Low' | 'Medium' | 'High';
  speed: number;
  heading: number;
  nextStopId: string;
  eta: number; // minutes
  driverId?: string;
  capacity?: number; // Total passenger capacity
  schedule?: RouteSchedule[]; // Schedule for each stop
  active?: boolean; // Whether the bus is currently active
  lastUpdated: Date;
}

export interface Driver {
  id: string;
  name: string;
  busId?: string;
  userId?: string; // Link to auth user ID
  email: string;
  phone: string;
}

// New type for driver invitations/assignments
export interface DriverInvite {
  id: string; // Unique driver ID/invite code
  busId?: string; // Bus assigned to this driver
  email?: string; // Optional pre-filled email
  name?: string; // Optional pre-filled name
  createdAt: string;
  createdBy: string; // Admin who created this
  claimed: boolean; // Whether a driver has registered with this ID
  claimedBy?: string; // User ID of the driver who claimed it
  claimedAt?: string;
}

// New type for route schedules
export interface RouteSchedule {
  stopId: string;
  arrivalTime: string; // Expected arrival time (e.g., "08:30", "14:45")
  departureTime?: string; // Optional departure time
}