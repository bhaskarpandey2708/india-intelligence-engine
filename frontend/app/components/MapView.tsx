'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/app/lib/api';
import { DistrictCensus } from '@/app/types';

// Colour scale for literacy rate choropleth
function getColor(literacyRate: number | null): string {
  if (literacyRate === null) return '#374151';
  if (literacyRate >= 85) return '#059669';
  if (literacyRate >= 75) return '#10b981';
  if (literacyRate >= 65) return '#f59e0b';
  if (literacyRate >= 55) return '#f97316';
  if (literacyRate >= 45) return '#ef4444';
  return '#991b1b';
}

interface Props {
  onDistrictClick: (district: DistrictCensus) => void;
  highlightDistrict?: string;
}

export default function MapView({ onDistrictClick, highlightDistrict }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import('leaflet').Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    async function init() {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        const map = L.map(mapRef.current!, {
          center: [22.5, 82.5],
          zoom: 5,
          zoomControl: true,
          attributionControl: true,
        });
        leafletMap.current = map;

        // Dark tile layer (free, no API key)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> | Census 2011 | SHRUG v2.1',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        // Load district census data for coloring
        const [censusData, geoData] = await Promise.all([
          api.districts({ limit: '700' }),
          api.geoDistricts(),
        ]);

        // Build lookup: district name → census row
        const censusMap: Record<string, import('@/app/types').District> = {};
        for (const d of censusData.districts) {
          censusMap[d.name.toUpperCase()] = d;
        }

        L.geoJSON(geoData as GeoJSON.FeatureCollection, {
          style: (feature) => {
            const name = (
              feature?.properties?.DISTRICT ||
              feature?.properties?.district_name ||
              feature?.properties?.District ||
              ''
            ).toUpperCase();
            const census = censusMap[name];
            return {
              fillColor: getColor(census?.literacy_rate ?? null),
              weight: 0.8,
              color: '#1f2937',
              fillOpacity: 0.75,
            };
          },
          onEachFeature: (feature, layer) => {
            const name = (
              feature.properties?.DISTRICT ||
              feature.properties?.district_name ||
              feature.properties?.District ||
              'Unknown'
            ).toUpperCase();
            const census = censusMap[name];

            layer.on('mouseover', function (this: import('leaflet').Layer & { setStyle: Function }) {
              this.setStyle({ weight: 2, color: '#60a5fa', fillOpacity: 0.9 });
            });
            layer.on('mouseout', function (this: import('leaflet').Layer & { setStyle: Function }) {
              this.setStyle({ weight: 0.8, color: '#1f2937', fillOpacity: 0.75 });
            });
            layer.on('click', async () => {
              if (census?.code) {
                try {
                  const full = await api.district(census.code);
                  onDistrictClick(full);
                } catch { /* ignore */ }
              }
            });

            if (census) {
              layer.bindTooltip(
                `<div class="font-semibold">${census.name}</div>
                 <div class="text-xs text-gray-300">${census.state}</div>
                 <div class="text-xs">Pop: ${(census.population / 1_000_000).toFixed(1)}M</div>
                 <div class="text-xs">Literacy: ${census.literacy_rate?.toFixed(1) ?? '—'}%</div>`,
                { sticky: true, className: 'india-tooltip' }
              );
            }
          },
        }).addTo(map);

        // Legend
        const legend = new L.Control({ position: 'bottomleft' });
        legend.onAdd = () => {
          const div = L.DomUtil.create('div', 'leaflet-control');
          div.innerHTML = `
            <div style="background:#111827;border:1px solid #374151;border-radius:8px;padding:10px;color:white;font-size:11px">
              <div style="font-weight:600;margin-bottom:6px;color:#9ca3af">LITERACY RATE</div>
              ${[['≥85%','#059669'],['75–85%','#10b981'],['65–75%','#f59e0b'],['55–65%','#f97316'],['45–55%','#ef4444'],['<45%','#991b1b']]
                .map(([label, color]) => `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                  <span style="width:12px;height:12px;background:${color};border-radius:2px;display:inline-block"></span>${label}
                </div>`).join('')}
            </div>`;
          return div;
        };
        legend.addTo(map);

        setLoading(false);
      } catch (e) {
        setError('Failed to load map. Make sure the API is running.');
        setLoading(false);
      }
    }

    init();

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading India map...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="text-center max-w-sm">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-2">Run: <code className="bg-gray-800 px-1 rounded">npm run start</code> in the api/ folder</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
