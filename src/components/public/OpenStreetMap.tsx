import React, { useEffect, useRef, useState } from 'react';
import { Loader, MapPin, RotateCcw, Minus, Plus } from 'lucide-react';
import { Bus, Route, BusStop } from '../../types';

interface OpenStreetMapProps {
  buses: Bus[];
  routes: Route[];
  stops: BusStop[];
  highContrast: boolean;
  is3D?: boolean;
}

declare global {
  interface Window { L: any; }
}

function occupancyColor(occ: string): string {
  return occ === 'Low' ? '#10B981' : occ === 'Medium' ? '#F59E0B' : '#EF4444';
}

function createBusIconHtml(bus: Bus, routeColor: string): string {
  const occColor = occupancyColor(bus.occupancy);
  const busNum = bus.busNumber || bus.id.replace('bus', '').replace('Bus', '');
  const heading = bus.heading || 0;
  return `
    <div style="position:relative;width:52px;height:70px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.25));">
      <div class="bus-rotating" style="
        position:absolute;top:0;left:4px;
        width:44px;height:54px;
        display:flex;flex-direction:column;align-items:center;gap:0;
        transform:rotate(${heading}deg);
        transition:transform 0.45s cubic-bezier(0.4,0,0.2,1);
        transform-origin:22px 27px;
      ">
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:11px solid ${routeColor};flex-shrink:0;"></div>
        <div style="width:44px;height:43px;background:${routeColor};border:3px solid white;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
          <div style="position:absolute;top:6px;left:5px;right:5px;height:14px;background:rgba(255,255,255,0.22);border-radius:4px;"></div>
          <svg width="26" height="26" fill="white" viewBox="0 0 24 24" style="position:relative;z-index:1;">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </div>
      </div>
      <div class="bus-occ-dot" style="position:absolute;top:6px;right:0;width:16px;height:16px;background:${occColor};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,0.3);z-index:10;transition:background 0.3s ease;"></div>
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);background:${routeColor};color:white;padding:2px 7px;border-radius:10px;font-size:10.5px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1.5px solid rgba(255,255,255,0.45);font-family:'Inter',sans-serif;">Bus ${busNum}</div>
    </div>
  `;
}

function createPopupContent(bus: Bus, route: any, nextStop: any): string {
  const occColor = occupancyColor(bus.occupancy);
  const routeColor = route?.color || '#3B82F6';
  return `
    <div style="padding:14px;font-family:'Inter',sans-serif;min-width:280px;">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
        <div style="width:56px;height:56px;background:${routeColor};border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 6px rgba(0,0,0,0.1);flex-shrink:0;">
          <svg width="28" height="28" fill="white" viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>
        </div>
        <div style="flex:1;">
          <h3 style="margin:0 0 5px 0;font-size:20px;font-weight:800;color:#1F2937;">Bus ${bus.id.replace('bus', '').replace('Bus', '')}</h3>
          <p style="margin:0;font-size:13px;color:#6B7280;font-weight:600;">${route?.name || 'Route'}</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0;">
        <div style="background:linear-gradient(135deg,#3B82F6 0%,#2563EB 100%);padding:12px;border-radius:10px;">
          <div style="font-size:10px;color:rgba(255,255,255,0.85);font-weight:700;margin-bottom:4px;">ETA</div>
          <div style="font-size:22px;font-weight:800;color:white;">${bus.eta} min</div>
        </div>
        <div style="background:#F3F4F6;padding:12px;border-radius:10px;">
          <div style="font-size:10px;color:#6B7280;font-weight:700;margin-bottom:4px;">SPEED</div>
          <div style="font-size:22px;font-weight:800;color:#1F2937;">${Math.round(bus.speed)} mph</div>
        </div>
      </div>
      <div style="margin:14px 0;padding:12px;background:#F9FAFB;border-left:4px solid ${routeColor};border-radius:8px;">
        <div style="font-size:10px;color:#6B7280;font-weight:700;margin-bottom:6px;">NEXT STOP</div>
        <div style="font-size:15px;font-weight:700;color:#1F2937;">${nextStop?.name || 'Unknown'}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:${occColor}18;border-radius:8px;">
        <div style="font-size:12px;color:#6B7280;font-weight:700;">OCCUPANCY</div>
        <div style="padding:5px 14px;background:${occColor};color:white;border-radius:20px;font-size:12px;font-weight:800;">${bus.occupancy}</div>
      </div>
    </div>
  `;
}

export default function OpenStreetMap({ buses, routes, stops, highContrast, is3D = false }: OpenStreetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string>('');
  const busMarkersRef = useRef<Map<string, any>>(new Map());
  const polylinesRef = useRef<any[]>([]);
  const stopMarkersRef = useRef<any[]>([]);

  const activeBuses = buses.filter(bus => bus.speed > 0 || (bus as any).active);

  const getCenterPoint = () => {
    if (activeBuses.length === 0) return { lat: 40.7128, lng: -74.0060 };
    const avgLat = activeBuses.reduce((sum, bus) => sum + bus.lat, 0) / activeBuses.length;
    const avgLng = activeBuses.reduce((sum, bus) => sum + bus.lng, 0) / activeBuses.length;
    return { lat: avgLat, lng: avgLng };
  };

  useEffect(() => {
    if (window.L) { setIsLoaded(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Failed to load map library');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || map || !window.L) return;
    try {
      const center = getCenterPoint();
      const mapInstance = window.L.map(mapRef.current, { center: [center.lat, center.lng], zoom: 13, zoomControl: false });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance);
      setMap(mapInstance);
    } catch (err) {
      setError('Failed to initialize map');
    }
  }, [isLoaded, highContrast]);

  useEffect(() => {
    if (!map || !isLoaded || !window.L) return;
    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = [];
    stops.forEach(stop => {
      const icon = window.L.divIcon({
        className: 'custom-stop-icon',
        html: `<div style="width:16px;height:16px;background:${highContrast ? '#FFFFFF' : '#3B82F6'};border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      });
      const marker = window.L.marker([stop.lat, stop.lng], { icon }).addTo(map);
      marker.bindPopup(`<div style="padding:12px;font-family:'Inter',sans-serif;"><strong>${(stop as any).name}</strong><br><small>Bus Stop</small></div>`);
      stopMarkersRef.current.push(marker);
    });
  }, [map, stops, isLoaded, highContrast]);

  useEffect(() => {
    if (!map || !isLoaded || !window.L) return;
    polylinesRef.current.forEach(p => p.remove());
    polylinesRef.current = [];
    routes.forEach(route => {
      const path = stops.filter(s => route.stops.includes(s.id)).map(s => [s.lat, s.lng]);
      const poly = window.L.polyline(path, { color: route.color, weight: 5, opacity: 0.7 }).addTo(map);
      polylinesRef.current.push(poly);
    });
  }, [map, routes, stops, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded || !window.L) return;
    const activeBusIds = new Set(activeBuses.map(b => b.id));
    for (const [id, marker] of busMarkersRef.current) {
      if (!activeBusIds.has(id)) { marker.remove(); busMarkersRef.current.delete(id); }
    }
    activeBuses.forEach(bus => {
      const route = routes.find(r => r.id === bus.routeId);
      const nextStop = stops.find(s => s.id === bus.nextStopId);
      const routeColor = route?.color || '#3B82F6';
      const occColor = occupancyColor(bus.occupancy);
      const existing = busMarkersRef.current.get(bus.id);
      if (existing) {
        existing.setLatLng([bus.lat, bus.lng]);
        const el = existing.getElement() as HTMLElement | undefined;
        if (el) {
          const rotating = el.querySelector('.bus-rotating') as HTMLElement | null;
          if (rotating) rotating.style.transform = `rotate(${bus.heading || 0}deg)`;
          const dot = el.querySelector('.bus-occ-dot') as HTMLElement | null;
          if (dot) dot.style.background = occColor;
        }
        const popup = existing.getPopup();
        if (popup && existing.isPopupOpen()) popup.setContent(createPopupContent(bus, route, nextStop));
      } else {
        const icon = window.L.divIcon({
          className: 'custom-bus-icon',
          html: createBusIconHtml(bus, routeColor),
          iconSize: [52, 70], iconAnchor: [26, 35], popupAnchor: [0, -38],
        });
        const marker = window.L.marker([bus.lat, bus.lng], { icon, zIndexOffset: 1000 }).addTo(map);
        marker.bindPopup(createPopupContent(bus, route, nextStop), { maxWidth: 320, className: 'transit-popup' });
        busMarkersRef.current.set(bus.id, marker);
      }
    });
  }, [map, activeBuses, routes, stops, isLoaded]);

  useEffect(() => {
    return () => { for (const m of busMarkersRef.current.values()) m.remove(); busMarkersRef.current.clear(); };
  }, []);

  if (error) return (
    <div className={`rounded-2xl overflow-hidden ${highContrast ? 'bg-gray-900 border-2 border-white' : 'bg-white shadow-xl'} flex items-center justify-center aspect-video`}>
      <div className="text-center p-8"><MapPin className="w-16 h-16 mx-auto text-red-500 mb-4" /><h3 className="text-xl font-bold mb-2">Map Loading Error</h3><p className="text-gray-600">{error}</p></div>
    </div>
  );

  if (!isLoaded) return (
    <div className={`rounded-2xl overflow-hidden ${highContrast ? 'bg-gray-900 border-2 border-white' : 'bg-white shadow-xl'} flex items-center justify-center aspect-video`}>
      <div className="text-center"><Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" /><p className="text-gray-600 font-medium">Loading Map...</p></div>
    </div>
  );

  return (
    <div className="relative">
      <div ref={mapRef} className={`w-full aspect-video rounded-2xl overflow-hidden ${highContrast ? 'border-2 border-white' : 'shadow-xl'}`} />
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        {[
          { onClick: () => map?.zoomIn(), icon: Plus, title: 'Zoom In' },
          { onClick: () => map?.zoomOut(), icon: Minus, title: 'Zoom Out' },
          { onClick: () => { const c = getCenterPoint(); map?.setView([c.lat, c.lng], 13); }, icon: RotateCcw, title: 'Reset' },
        ].map(({ onClick, icon: Icon, title }) => (
          <button key={title} onClick={onClick} className={`p-3 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${highContrast ? 'bg-black border-2 border-white text-white' : 'bg-white/90 hover:bg-white'}`} title={title}>
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>
      <div className={`absolute top-4 left-4 z-[1000] ${highContrast ? 'bg-black border-2 border-white text-white' : 'bg-white/95 backdrop-blur-xl shadow-xl'} rounded-xl px-5 py-3 text-sm`}>
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-bold">OpenStreetMap {is3D ? '3D' : '2D'} View</div>
            <div className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-600'}`}>Live tracking • {activeBuses.length} bus{activeBuses.length !== 1 ? 'es' : ''} moving</div>
          </div>
        </div>
      </div>
      {activeBuses.length > 0 && (
        <div className={`absolute bottom-4 left-4 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${highContrast ? 'bg-black border border-white text-white' : 'bg-white/95 backdrop-blur-xl shadow-lg'}`}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className={highContrast ? 'text-green-400' : 'text-green-700'}>Buses moving live</span>
        </div>
      )}
    </div>
  );
}
