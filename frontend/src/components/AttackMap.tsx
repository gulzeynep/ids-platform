import React from "react";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
declare module "react-simple-maps";

// Dünya haritası verisi (TopoJSON)
const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/master/world.json";

interface Attack {
  id: string;
  from: [number, number]; // [lon, lat]
  to: [number, number];   // Senin sunucun [lon, lat]
  color: string;
}

export default function AttackMap({ attacks }: { attacks: Attack[] }) {
  // Senin sunucun varsayılan olarak Türkiye/İstanbul koordinatlarında olsun
  const myServer: [number, number] = [28.9784, 41.0082];

  return (
    <div className="w-full h-[500px] bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden relative shadow-2xl">
      <div className="absolute top-6 left-8 z-10">
        <h3 className="text-white font-black italic uppercase tracking-tighter text-lg">Live Global Threat Map</h3>
        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.3em]">Perimeter Node: Istanbul_01</p>
      </div>

      <ComposableMap projectionConfig={{ scale: 200 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#111"
                stroke="#222"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#1a1a1a", outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {attacks.map((attack) => (
          <React.Fragment key={attack.id}>
            {/* Saldırı Çizgisi (Arc) */}
            <Line
              from={attack.from}
              to={myServer}
              stroke={attack.color}
              strokeWidth={2}
              strokeLinecap="round"
              className="animate-pulse"
              style={{
                strokeDasharray: "4, 4",
                opacity: 0.6
              }}
            />
            {/* Kaynak Marker (Saldırgan) */}
            <Marker coordinates={attack.from}>
              <circle r={4} fill={attack.color} className="animate-ping" />
              <circle r={2} fill={attack.color} />
            </Marker>
          </React.Fragment>
        ))}

        {/* Hedef Marker (Senin Sunucun) */}
        <Marker coordinates={myServer}>
          <circle r={6} fill="#3b82f6" fillOpacity={0.3} />
          <circle r={3} fill="#3b82f6" />
          <text textAnchor="middle" y={-15} style={{ fontSize: "8px", fill: "#3b82f6", fontWeight: "bold" }}>
            HQ
          </text>
        </Marker>
      </ComposableMap>
    </div>
  );
}