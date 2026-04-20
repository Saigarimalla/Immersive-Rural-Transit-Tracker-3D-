import { useState, useEffect, useRef } from 'react';
import { Bus } from '../types';

// Minimal interfaces matching the shape used across the app
interface SimRoute {
  id: string;
  stops: string[];
  color?: string;
}

interface SimStop {
  id: string;
  lat: number;
  lng: number;
  name?: string;
}

interface BusSimState {
  lat: number;
  lng: number;
  heading: number;
  eta: number;
  nextStopId: string;
  // Segment the bus is currently traversing
  segStartLat: number;
  segStartLng: number;
  segEndLat: number;
  segEndLng: number;
  segLengthKm: number;
  segProgress: number; // 0 → 1
  // Route stop sequence
  stopSequence: string[];
  currentStopIdx: number; // index of the "next stop" in stopSequence
}

const TICK_MS = 80; // ~12fps — smooth but lightweight

// ─── Geometry helpers ──────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useBusSimulation(
  buses: Bus[],
  routes: SimRoute[],
  stops: SimStop[]
): Bus[] {
  const simRef = useRef<Map<string, BusSimState>>(new Map());
  // Initialize with empty array — the interval will populate it on the first tick
  const [animatedBuses, setAnimatedBuses] = useState<Bus[]>([]);

  // Refs so the animation interval can read latest values without depending on them
  const busesRef = useRef(buses);
  const routesRef = useRef(routes);
  const stopsRef = useRef(stops);
  useEffect(() => { busesRef.current = buses; }, [buses]);
  useEffect(() => { routesRef.current = routes; }, [routes]);
  useEffect(() => { stopsRef.current = stops; }, [stops]);

  // ── Initialize / sync simulation state when server data changes ──────────────
  useEffect(() => {
    // No setState here — only mutate the simRef so we don't trigger re-renders
    const stopsMap = new Map(stops.map((s) => [s.id, s]));

    buses.forEach((bus) => {
      const route = routes.find((r) => r.id === bus.routeId);
      if (!route || route.stops.length < 2) return;

      const stopSeq = route.stops;
      const nextIdx = stopSeq.indexOf(bus.nextStopId);
      if (nextIdx === -1) return;
      const prevIdx = Math.max(0, nextIdx - 1);

      const prevStop = stopsMap.get(stopSeq[prevIdx]);
      const nextStop = stopsMap.get(stopSeq[nextIdx]);
      if (!prevStop || !nextStop) return;

      const segLen = haversineKm(prevStop.lat, prevStop.lng, nextStop.lat, nextStop.lng);
      const heading = bearingDeg(prevStop.lat, prevStop.lng, nextStop.lat, nextStop.lng);

      const existing = simRef.current.get(bus.id);

      if (!existing) {
        // First time — place bus at its server-reported position
        const distFromPrev = haversineKm(prevStop.lat, prevStop.lng, bus.lat, bus.lng);
        const progress = segLen > 0 ? Math.min(1, distFromPrev / segLen) : 0;
        simRef.current.set(bus.id, {
          lat: bus.lat,
          lng: bus.lng,
          heading,
          eta: bus.eta,
          nextStopId: bus.nextStopId,
          segStartLat: prevStop.lat,
          segStartLng: prevStop.lng,
          segEndLat: nextStop.lat,
          segEndLng: nextStop.lng,
          segLengthKm: segLen,
          segProgress: progress,
          stopSequence: stopSeq,
          currentStopIdx: nextIdx,
        });
      } else if (existing.nextStopId !== bus.nextStopId) {
        // Server reported a new nextStopId — re-anchor the segment
        existing.nextStopId = bus.nextStopId;
        existing.currentStopIdx = nextIdx;
        existing.segStartLat = prevStop.lat;
        existing.segStartLng = prevStop.lng;
        existing.segEndLat = nextStop.lat;
        existing.segEndLng = nextStop.lng;
        existing.segLengthKm = segLen;
        existing.segProgress = 0;
        existing.heading = heading;
        existing.eta = bus.eta;
      }
    });

    // Prune removed buses
    const ids = new Set(buses.map((b) => b.id));
    for (const id of simRef.current.keys()) {
      if (!ids.has(id)) simRef.current.delete(id);
    }
  }, [buses, routes, stops]);

  // ── Animation tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const currentBuses = busesRef.current;
      if (!currentBuses.length) return;

      const stopsMap = new Map(stopsRef.current.map((s) => [s.id, s]));

      const next = currentBuses.map((bus): Bus => {
        const sim = simRef.current.get(bus.id);
        // No simulation state, or bus not moving — return as-is
        if (!sim || bus.speed <= 0) return bus;

        const route = routesRef.current.find((r) => r.id === bus.routeId);
        if (!route || route.stops.length < 2) return bus;

        // Convert mph → km/tick
        const speedKmh = Math.max(5, bus.speed) * 1.60934;
        const kmPerTick = (speedKmh / 3600) * (TICK_MS / 1000);

        if (sim.segLengthKm > 0) {
          sim.segProgress = Math.min(1, sim.segProgress + kmPerTick / sim.segLengthKm);
        }

        // Interpolate current position
        sim.lat = lerp(sim.segStartLat, sim.segEndLat, sim.segProgress);
        sim.lng = lerp(sim.segStartLng, sim.segEndLng, sim.segProgress);

        // Bearing stays constant for the whole segment (smooth)
        sim.heading = bearingDeg(
          sim.segStartLat, sim.segStartLng,
          sim.segEndLat, sim.segEndLng
        );

        // Reached next stop — advance to following segment
        if (sim.segProgress >= 1) {
          const nextIdx = (sim.currentStopIdx + 1) % route.stops.length;
          const arrivedStop = stopsMap.get(route.stops[sim.currentStopIdx]);
          const departingTo = stopsMap.get(route.stops[nextIdx]);

          if (arrivedStop && departingTo) {
            sim.segStartLat = arrivedStop.lat;
            sim.segStartLng = arrivedStop.lng;
            sim.segEndLat = departingTo.lat;
            sim.segEndLng = departingTo.lng;
            sim.segLengthKm = haversineKm(
              arrivedStop.lat, arrivedStop.lng,
              departingTo.lat, departingTo.lng
            );
            sim.currentStopIdx = nextIdx;
            sim.nextStopId = route.stops[nextIdx];
            sim.segProgress = 0;
            sim.heading = bearingDeg(
              arrivedStop.lat, arrivedStop.lng,
              departingTo.lat, departingTo.lng
            );
          }
        }

        // Dynamic ETA: distance to next stop ÷ speed
        const distToNext = haversineKm(sim.lat, sim.lng, sim.segEndLat, sim.segEndLng);
        const speedKmMin = speedKmh / 60;
        sim.eta = speedKmMin > 0 ? Math.max(1, Math.round(distToNext / speedKmMin)) : bus.eta;

        return {
          ...bus,
          lat: sim.lat,
          lng: sim.lng,
          heading: sim.heading,
          eta: sim.eta,
          nextStopId: sim.nextStopId,
        };
      });

      setAnimatedBuses(next);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []); // Reads from refs — intentionally empty deps

  return animatedBuses;
}