'use client';
import { useEffect, useRef } from 'react';
import { api } from '@/app/lib/api';
import { District, DrillLevel, MapLayer } from '@/app/types';

function getColor(layer: MapLayer, d: District | undefined): string {
  if (!d) return '#374151';
  switch (layer) {
    case 'literacy': {
      const v = d.literacy_rate;
      if (v == null) return '#374151';
      if (v >= 85) return '#059669';
      if (v >= 75) return '#10b981';
      if (v >= 65) return '#f59e0b';
      if (v >= 55) return '#f97316';
      if (v >= 45) return '#ef4444';
      return '#991b1b';
    }
    case 'population': {
      const v = d.population / 1_000_000;
      if (v >= 5) return '#6d28d9';
      if (v >= 3) return '#7c3aed';
      if (v >= 2) return '#2563eb';
      if (v >= 1) return '#3b82f6';
      if (v >= 0.5) return '#60a5fa';
      return '#bfdbfe';
    }
    case 'sex_ratio': {
      const v = d.sex_ratio;
      if (v == null) return '#374151';
      if (v >= 1000) return '#059669';
      if (v >= 950) return '#10b981';
      if (v >= 900) return '#f59e0b';
      if (v >= 850) return '#f97316';
      if (v >= 800) return '#ef4444';
      return '#991b1b';
    }
    case 'sc_pct': {
      const v = d.sc_pct;
      if (v == null) return '#374151';
      if (v >= 30) return '#7c3aed';
      if (v >= 20) return '#8b5cf6';
      if (v >= 15) return '#a78bfa';
      if (v >= 10) return '#c4b5fd';
      if (v >= 5)  return '#ddd6fe';
      return '#ede9fe';
    }
    case 'st_pct': {
      const v = d.st_pct;
      if (v == null) return '#374151';
      if (v >= 50) return '#0f766e';
      if (v >= 30) return '#0d9488';
      if (v >= 15) return '#14b8a6';
      if (v >= 5)  return '#2dd4bf';
      if (v >= 1)  return '#99f6e4';
      return '#ccfbf1';
    }
  }
}

const LEGEND: Record<MapLayer, { title: string; steps: [string, string][] }> = {
  literacy:   { title: 'LITERACY RATE',     steps: [['>=85%','#059669'],['75-85%','#10b981'],['65-75%','#f59e0b'],['55-65%','#f97316'],['45-55%','#ef4444'],['<45%','#991b1b']] },
  population: { title: 'POPULATION',        steps: [['>=5M','#6d28d9'],['3-5M','#7c3aed'],['2-3M','#2563eb'],['1-2M','#3b82f6'],['0.5-1M','#60a5fa'],['<0.5M','#bfdbfe']] },
  sex_ratio:  { title: 'SEX RATIO (/1000)', steps: [['>=1000','#059669'],['950-999','#10b981'],['900-949','#f59e0b'],['850-899','#f97316'],['800-849','#ef4444'],['<800','#991b1b']] },
  sc_pct:     { title: 'SC POPULATION %',   steps: [['>=30%','#7c3aed'],['20-30%','#8b5cf6'],['15-20%','#a78bfa'],['10-15%','#c4b5fd'],['5-10%','#ddd6fe'],['<5%','#ede9fe']] },
  st_pct:     { title: 'ST POPULATION %',   steps: [['>=50%','#0f766e'],['30-50%','#0d9488'],['15-30%','#14b8a6'],['5-15%','#2dd4bf'],['1-5%','#99f6e4'],['<1%','#ccfbf1']] },
};

function baseStyle(fillColor: string) {
  return { fillColor, weight: 0.8, color: '#1f2937', fillOpacity: 0.75 };
}

function getDistrictName(feature: GeoJSON.Feature | undefined): string {
  return (
    feature?.properties?.DISTRICT ||
    feature?.properties?.district_name ||
    feature?.properties?.District ||
    ''
  ).toUpperCase();
}

function getSubdistrictName(feature: GeoJSON.Feature | undefined): string {
  return (
    feature?.properties?.SUBDIST ||
    feature?.properties?.subdist_name ||
    feature?.properties?.NAME ||
    feature?.properties?.name ||
    'Sub-district'
  );
}

function buildTooltip(d: District): string {
  return '<div style="font-weight:600">' + d.name + '</div>' +
         '<div style="font-size:11px;color:#9ca3af">' + d.state + '</div>' +
         '<div style="font-size:11px">Pop: ' + (d.population / 1_000_000).toFixed(1) + 'M</div>' +
         '<div style="font-size:11px">Literacy: ' + (d.literacy_rate != null ? d.literacy_rate.toFixed(1) : '--') + '%</div>' +
         '<div style="font-size:11px">Sex Ratio: ' + (d.sex_ratio ?? '--') + '/1000</div>';
}

function addLegend(L: typeof import('leaflet'), map: import('leaflet').Map, layer: MapLayer): import('leaflet').Control {
  const { title, steps } = LEGEND[layer];
  const control = new L.Control({ position: 'bottomleft' });
  control.onAdd = () => {
    const div = L.DomUtil.create('div', 'leaflet-control');
    div.innerHTML = '<div style="background:#111827;border:1px solid #374151;border-radius:8px;padding:10px;color:white;font-size:11px;min-width:130px">' +
      '<div style="font-weight:600;margin-bottom:6px;color:#9ca3af;letter-spacing:0.05em">' + title + '</div>' +
      steps.map(function(s) {
        return '<div style="display:flex;align-items:center;gap:6px;margin:3px 0">' +
          '<span style="width:12px;height:12px;background:' + s[1] + ';border-radius:2px;flex-shrink:0;display:inline-block"></span>' +
          '<span>' + s[0] + '</span></div>';
      }).join('') + '</div>';
    return div;
  };
  control.addTo(map);
  return control;
}

interface Props {
  level: DrillLevel;
  selectedState: string;
  selectedDistrict: District | null;
  layer: MapLayer;
  onDistrictClick: (district: District | null) => void;
}

export default function MapView({ level, selectedState, selectedDistrict, layer, onDistrictClick }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import('leaflet').Map | null>(null);
  const geoLayerRef = useRef<import('leaflet').GeoJSON | null>(null);
  const censusMap  = useRef<Record<string, District>>({});
  const legendRef  = useRef<import('leaflet').Control | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const layerRef   = useRef(layer);
  layerRef.current = layer;

  // Init map once
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current!, {
        center: [22.5, 82.5],
        zoom: 5,
        zoomControl: true,
      });
      leafletMap.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | Census 2011',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      try {
        const { districts } = await api.districts({ limit: '700' });
        const m: Record<string, District> = {};
        for (const d of districts) {
          m[d.name.toUpperCase()] = d;
          m[d.code] = d;
        }
        censusMap.current = m;
      } catch { /* continue */ }

      if (loadingRef.current) loadingRef.current.style.display = 'none';
    })();

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
      geoLayerRef.current = null;
    };
  }, []);

  // Reload geo layer when drill level changes
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    let cancelled = false;

    (async () => {
      try {
        if (loadingRef.current) loadingRef.current.style.display = 'flex';

        if (geoLayerRef.current) { geoLayerRef.current.remove(); geoLayerRef.current = null; }
        if (legendRef.current)   { legendRef.current.remove();   legendRef.current = null; }

        const L = (await import('leaflet')).default;
        const isSubdistrict = level === 'district';

        let geoData: GeoJSON.FeatureCollection;
        if (level === 'national') {
          geoData = await api.geoDistricts();
        } else if (level === 'state') {
          geoData = await api.geoDistricts(selectedState);
        } else {
          geoData = await api.geoSubdistricts(selectedDistrict?.name);
        }

        if (cancelled) return;

        const cm = censusMap.current;
        const currentLayer = layerRef.current;

        const newLayer = L.geoJSON(geoData as GeoJSON.FeatureCollection, {
          style: (feature) => {
            if (isSubdistrict) {
              return { fillColor: '#1e40af', weight: 1, color: '#3b82f6', fillOpacity: 0.4 };
            }
            const name = getDistrictName(feature);
            return baseStyle(getColor(currentLayer, cm[name]));
          },
          onEachFeature: (feature, lyr) => {
            const distName = getDistrictName(feature);
            const census = cm[distName];
            const subdistName = isSubdistrict ? getSubdistrictName(feature) : '';

            lyr.on('mouseover', function (this: import('leaflet').Path) {
              this.setStyle({ weight: 2, color: '#60a5fa', fillOpacity: 0.9 });
            });
            lyr.on('mouseout', function (this: import('leaflet').Path) {
              if (isSubdistrict) {
                this.setStyle({ weight: 1, color: '#3b82f6', fillOpacity: 0.4 });
              } else {
                this.setStyle({ weight: 0.8, color: '#1f2937', fillOpacity: 0.75 });
              }
            });

            if (!isSubdistrict && census) {
              lyr.on('click', () => onDistrictClick(census));
              lyr.bindTooltip(buildTooltip(census), { sticky: true, className: 'india-tooltip' });
            } else if (isSubdistrict) {
              lyr.bindTooltip(
                '<div style="font-weight:600">' + subdistName + '</div>' +
                '<div style="font-size:11px;color:#9ca3af">Sub-district</div>',
                { sticky: true, className: 'india-tooltip' }
              );
            }
          },
        }).addTo(map);

        geoLayerRef.current = newLayer;

        const bounds = newLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20], animate: true, duration: 0.7 });
        }

        if (!isSubdistrict) {
          legendRef.current = addLegend(L, map, currentLayer);
        }

        if (loadingRef.current) loadingRef.current.style.display = 'none';
      } catch {
        if (!cancelled && loadingRef.current) loadingRef.current.style.display = 'none';
      }
    })();

    return () => { cancelled = true; };
  }, [level, selectedState, selectedDistrict]);

  // Re-style on layer toggle (no GeoJSON reload)
  useEffect(() => {
    const map = leafletMap.current;
    if (!geoLayerRef.current || !map || level === 'district') return;

    geoLayerRef.current.setStyle((feature) => {
      const name = getDistrictName(feature);
      return baseStyle(getColor(layer, censusMap.current[name]));
    });

    import('leaflet').then(({ default: L }) => {
      if (legendRef.current) { legendRef.current.remove(); legendRef.current = null; }
      legendRef.current = addLegend(L, map, layer);
    });
  }, [layer]);

  return (
    <div className="relative w-full h-full">
      <div ref={loadingRef} className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading map...</p>
        </div>
      </div>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
