import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useQuery } from '@tanstack/react-query';
import { Loader2, Crosshair } from 'lucide-react';
import api from '../lib/api';

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const AttackMap = () => {
  // Fetch recent alerts that include location data from our new GeoIP utility
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['map-alerts'],
    queryFn: async () => {
      const response = await api.get('/alerts/recent');
      return response.data;
    },
    refetchInterval: 5000, // Frequent updates for the map
  });

  // Filter alerts that have valid coordinates (mocked or real)
  const attackMarkers = useMemo(() => {
    return alerts?.filter((a: any) => a.source_ip).map((a: any) => ({
      id: a.id,
      name: a.type,
      // In a real scenario, the backend would provide these via GeoIP
      // For now, we'll map them based on a helper or random logic for demo
      coordinates: [Math.random() * 360 - 180, Math.random() * 180 - 90], 
      severity: a.severity
    })) || [];
  }, [alerts]);

  if (isLoading) return <Loader2 className="animate-spin text-blue-500 mx-auto mt-20" />;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Crosshair className="text-red-500 w-5 h-5" /> Live Attack Origin Map
        </h3>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Global Ingress Traffic</span>
      </div>

      <div className="h-[400px] w-full bg-slate-950 rounded-xl border border-slate-800/50">
        <ComposableMap projectionConfig={{ scale: 145 }}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#0f172a"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#334155", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          {attackMarkers.map(({ id, coordinates, severity }: any) => (
            <Marker key={id} coordinates={coordinates}>
              <circle 
                r={severity === 'critical' ? 6 : 4} 
                fill={severity === 'critical' ? "#ef4444" : "#3b82f6"} 
                className="animate-pulse"
              />
              <circle 
                r={severity === 'critical' ? 12 : 8} 
                fill="none" 
                stroke={severity === 'critical' ? "#ef4444" : "#3b82f6"} 
                strokeWidth={1}
                className="animate-ping opacity-25"
              />
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </div>
  );
};

export default AttackMap;