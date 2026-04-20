import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Move, Maximize2 } from 'lucide-react';
import { Bus, Route, BusStop } from '../../types';

interface ThreeDViewProps {
  buses: Bus[];
  routes: Route[];
  stops: BusStop[];
  highContrast: boolean;
}

export default function ThreeDView({ buses, routes, stops, highContrast }: ThreeDViewProps) {
  const [rotation, setRotation] = useState({ x: 45, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [animationTime, setAnimationTime] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTime(prev => prev + 1);
      if (autoRotate && !isDragging) setRotation(prev => ({ ...prev, y: prev.y + 0.5 }));
    }, 50);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x + (e.clientY - dragStart.y) * 0.3)),
      y: prev.y + (e.clientX - dragStart.x) * 0.3,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  const allLats = [...buses.map(b => b.lat), ...stops.map(s => s.lat)];
  const allLngs = [...buses.map(b => b.lng), ...stops.map(s => s.lng)];
  const centerLat = (Math.min(...allLats) + Math.max(...allLats)) / 2;
  const centerLng = (Math.min(...allLngs) + Math.max(...allLngs)) / 2;

  const latLngTo3D = (lat: number, lng: number, height: number = 0) => ({
    x: ((lng - centerLng) * 1000) * zoom,
    y: -height * zoom,
    z: ((lat - centerLat) * 1000) * zoom,
  });

  const rotate3D = (x: number, y: number, z: number) => {
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;
    let nx = x * Math.cos(radY) + z * Math.sin(radY);
    let nz = -x * Math.sin(radY) + z * Math.cos(radY);
    const ny = y * Math.cos(radX) - nz * Math.sin(radX);
    nz = y * Math.sin(radX) + nz * Math.cos(radX);
    return { x: nx, y: ny, z: nz };
  };

  const project = (x: number, y: number, z: number) => {
    const p = 800;
    const scale = p / (p + z);
    return { x: 400 + x * scale, y: 300 + y * scale, scale, depth: z };
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden ${highContrast ? 'bg-gray-900 border-2 border-white' : 'bg-white shadow-xl'}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {[
          { onClick: () => setZoom(Math.min(2, zoom + 0.1)), icon: ZoomIn, label: 'Zoom in' },
          { onClick: () => setZoom(Math.max(0.5, zoom - 0.1)), icon: ZoomOut, label: 'Zoom out' },
          { onClick: () => setAutoRotate(!autoRotate), icon: Maximize2, label: 'Auto rotate', active: autoRotate },
          { onClick: () => { setRotation({ x: 45, y: 0 }); setZoom(1); setAutoRotate(false); }, icon: RotateCcw, label: 'Reset view' },
        ].map(({ onClick, icon: Icon, label, active }) => (
          <button key={label} onClick={onClick} className={`p-3 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${active ? 'bg-blue-600 text-white' : highContrast ? 'bg-black border-2 border-white text-white' : 'bg-white/90 hover:bg-white'}`} aria-label={label}>
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      <div className={`absolute top-4 left-4 z-10 ${highContrast ? 'bg-black border-2 border-white text-white' : 'bg-white/95 backdrop-blur-xl shadow-xl'} rounded-xl px-5 py-3 text-sm flex items-center gap-3`}>
        <Move className="w-5 h-5 text-blue-600" />
        <div>
          <div className="font-bold">Interactive 3D View</div>
          <div className={`text-xs ${highContrast ? 'text-gray-400' : 'text-gray-600'}`}>Drag to rotate • Scroll to zoom</div>
        </div>
      </div>

      <div ref={containerRef} className={`aspect-video ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="ground3d" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={highContrast ? '#1F2937' : '#DBEAFE'} />
              <stop offset="100%" stopColor={highContrast ? '#111827' : '#93C5FD'} />
            </linearGradient>
            <linearGradient id="sky3d" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={highContrast ? '#000000' : '#60A5FA'} />
              <stop offset="100%" stopColor={highContrast ? '#111827' : '#DBEAFE'} />
            </linearGradient>
            <filter id="glow3d">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <rect width="800" height="600" fill="url(#sky3d)" />
          <ellipse cx="400" cy="480" rx="350" ry="120" fill="url(#ground3d)" opacity="0.8" />

          {routes.map(route => {
            const pts = stops.filter(s => route.stops.includes(s.id)).map(stop => {
              const p3 = latLngTo3D(stop.lat, stop.lng, 1);
              const r = rotate3D(p3.x, p3.y, p3.z);
              return project(r.x, r.y, r.z);
            });
            const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            return (
              <path key={route.id} d={d} stroke={route.color} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="8,4" opacity="0.6" />
            );
          })}

          {stops.map(stop => {
            const p3 = latLngTo3D(stop.lat, stop.lng, 0);
            const r = rotate3D(p3.x, p3.y, p3.z);
            const p = project(r.x, r.y, r.z);
            return (
              <g key={stop.id}>
                <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 40 * p.scale} stroke={highContrast ? '#FFFFFF' : '#4B5563'} strokeWidth={3 * p.scale} strokeLinecap="round" />
                <circle cx={p.x} cy={p.y - 40 * p.scale} r={10 * p.scale} fill={highContrast ? '#FFFFFF' : '#3B82F6'} filter="url(#glow3d)" />
                <text x={p.x} y={p.y - 50 * p.scale} fontSize={10 * p.scale} fill={highContrast ? '#FFFFFF' : '#1F2937'} textAnchor="middle" fontWeight="600" opacity="0.8">{stop.name}</text>
              </g>
            );
          })}

          {buses.map((bus, index) => {
            const route = routes.find(r => r.id === bus.routeId);
            const floatH = 15 + Math.sin(animationTime / 10 + index * 2) * 5;
            const p3 = latLngTo3D(bus.lat, bus.lng, floatH);
            const r = rotate3D(p3.x, p3.y, p3.z);
            const p = project(r.x, r.y, r.z);
            const wobble = Math.sin(animationTime / 5 + index) * 2;
            return (
              <g key={bus.id}>
                <ellipse cx={p.x} cy={480} rx={25 * p.scale} ry={8 * p.scale} fill="#000000" opacity="0.15" />
                <g transform={`translate(${p.x}, ${p.y}) rotate(${wobble})`}>
                  <rect x={-18 * p.scale} y={-25 * p.scale} width={36 * p.scale} height={50 * p.scale} rx={4 * p.scale} fill={route?.color || '#3B82F6'} stroke={highContrast ? '#FFFFFF' : '#1F2937'} strokeWidth={2.5 * p.scale} />
                  <rect x={-14 * p.scale} y={-22 * p.scale} width={28 * p.scale} height={12 * p.scale} rx={2 * p.scale} fill={highContrast ? '#000000' : '#DBEAFE'} opacity="0.7" />
                  <rect x={-14 * p.scale} y={-8 * p.scale} width={28 * p.scale} height={20 * p.scale} rx={2 * p.scale} fill={highContrast ? '#000000' : '#DBEAFE'} opacity="0.6" />
                  <circle cx={-10 * p.scale} cy={25 * p.scale} r={4 * p.scale} fill="#1F2937" />
                  <circle cx={10 * p.scale} cy={25 * p.scale} r={4 * p.scale} fill="#1F2937" />
                  <text x={0} y={-32 * p.scale} fontSize={8 * p.scale} fill={highContrast ? '#FFFFFF' : '#1F2937'} textAnchor="middle" fontWeight="800">{bus.id.replace('bus', '')}</text>
                  <circle cx={22 * p.scale} cy={-28 * p.scale} r={5 * p.scale} fill={bus.occupancy === 'Low' ? '#10B981' : bus.occupancy === 'Medium' ? '#F59E0B' : '#EF4444'} filter="url(#glow3d)" />
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={`absolute bottom-4 left-4 ${highContrast ? 'bg-black border-2 border-white text-white' : 'bg-white/95 backdrop-blur-xl shadow-xl'} rounded-xl px-5 py-4 text-sm`}>
        <div className="space-y-2">
          <div className="font-bold text-base mb-3">3D View Stats</div>
          <div className="flex items-center justify-between gap-6">
            <span className={highContrast ? 'text-gray-400' : 'text-gray-600'}>Rotation:</span>
            <span className="font-mono font-semibold">X: {Math.round(rotation.x)}° Y: {Math.round(rotation.y)}°</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className={highContrast ? 'text-gray-400' : 'text-gray-600'}>Zoom:</span>
            <span className="font-mono font-semibold">{(zoom * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className={highContrast ? 'text-gray-400' : 'text-gray-600'}>Active Buses:</span>
            <span className="font-bold text-blue-600">{buses.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
