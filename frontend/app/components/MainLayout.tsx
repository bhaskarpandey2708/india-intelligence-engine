'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/app/lib/api';
import { District, DistrictCensus, DrillLevel, MapLayer, NationalStats, State } from '@/app/types';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

const LAYERS: { id: MapLayer; label: string }[] = [
  { id: 'literacy',   label: 'Literacy' },
  { id: 'population', label: 'Population' },
  { id: 'sex_ratio',  label: 'Sex Ratio' },
  { id: 'sc_pct',     label: 'SC %' },
  { id: 'st_pct',     label: 'ST %' },
];

const toTitle = (s: string) =>
  s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

function fmt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString('en-IN');
}

function DataRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="text-white text-xs font-medium">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">{title}</p>
      {children}
    </div>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="bg-gray-700 rounded-full h-1 mt-0.5">
      <div className="h-1 rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

function NationalPanel({ stats }: { stats: NationalStats | null }) {
  if (!stats) return <div className="p-4 text-gray-600 text-xs">Loading...</div>;
  return (
    <div className="p-4">
      <Section title="Overview">
        <DataRow label="Total Population" value={fmt(stats.total_population)} />
        <DataRow label="Total Districts" value={stats.total_districts} />
        <DataRow label="Avg Literacy" value={`${stats.avg_literacy_rate}%`} />
        <DataRow label="Avg Sex Ratio" value={`${stats.avg_sex_ratio} / 1000`} />
      </Section>
      <Section title="Highlights">
        <div className="space-y-2">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-0.5">Most Populous District</p>
            <p className="text-white text-sm font-semibold">{toTitle(stats.most_populous_district.name)}</p>
            <p className="text-gray-400 text-xs">{toTitle(stats.most_populous_district.state)}</p>
            <p className="text-blue-400 text-xs">{fmt(stats.most_populous_district.population)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-0.5">Highest Literacy</p>
            <p className="text-white text-sm font-semibold">{toTitle(stats.highest_literacy_district.name)}</p>
            <p className="text-gray-400 text-xs">{toTitle(stats.highest_literacy_district.state)}</p>
            <p className="text-green-400 text-xs">{stats.highest_literacy_district.literacy}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-0.5">Lowest Literacy</p>
            <p className="text-white text-sm font-semibold">{toTitle(stats.lowest_literacy_district.name)}</p>
            <p className="text-gray-400 text-xs">{toTitle(stats.lowest_literacy_district.state)}</p>
            <p className="text-red-400 text-xs">{stats.lowest_literacy_district.literacy}%</p>
          </div>
        </div>
      </Section>
      <p className="text-gray-600 text-xs text-center mt-2">Select a state to drill down ↓</p>
    </div>
  );
}

function StatePanel({ state, districts }: { state: State | null; districts: District[] }) {
  if (!state) return <div className="p-4 text-gray-600 text-xs">Loading...</div>;

  const byLiteracy = [...districts].filter(d => d.literacy_rate != null).sort((a, b) => (b.literacy_rate ?? 0) - (a.literacy_rate ?? 0));
  const avgLiteracy = byLiteracy.length > 0
    ? (byLiteracy.reduce((s, d) => s + (d.literacy_rate ?? 0), 0) / byLiteracy.length).toFixed(1)
    : null;

  return (
    <div className="p-4">
      <Section title="State Overview">
        <DataRow label="Population" value={fmt(state.population)} />
        <DataRow label="Area" value={`${state.area_sq_km.toLocaleString('en-IN')} km²`} />
        <DataRow label="Density" value={`${state.density} / km²`} />
        <DataRow label="Sex Ratio" value={`${state.sex_ratio} / 1000`} />
        <DataRow label="Districts" value={districts.length} />
        {avgLiteracy && <DataRow label="Avg Literacy" value={`${avgLiteracy}%`} />}
      </Section>

      {byLiteracy.length >= 2 && (
        <Section title="Literacy Range">
          <div className="space-y-1.5">
            <div className="bg-green-900/30 border border-green-900/50 rounded-lg p-2.5">
              <p className="text-gray-500 text-xs">Highest</p>
              <p className="text-white text-xs font-semibold">{toTitle(byLiteracy[0].name)}</p>
              <p className="text-green-400 text-xs font-medium">{byLiteracy[0].literacy_rate?.toFixed(1)}%</p>
            </div>
            <div className="bg-red-900/30 border border-red-900/50 rounded-lg p-2.5">
              <p className="text-gray-500 text-xs">Lowest</p>
              <p className="text-white text-xs font-semibold">{toTitle(byLiteracy.at(-1)!.name)}</p>
              <p className="text-red-400 text-xs font-medium">{byLiteracy.at(-1)!.literacy_rate?.toFixed(1)}%</p>
            </div>
          </div>
        </Section>
      )}

      {districts.length > 0 && (
        <Section title={`All Districts (${districts.length})`}>
          <div className="space-y-0">
            {[...districts]
              .sort((a, b) => b.population - a.population)
              .map(d => (
                <div key={d.code} className="flex justify-between items-center py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-white text-xs">{toTitle(d.name)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{fmt(d.population)}</span>
                    <span className="text-gray-600 text-xs w-10 text-right">{d.literacy_rate?.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
          </div>
        </Section>
      )}
      <p className="text-gray-600 text-xs text-center mt-2">Select a district to drill down ↓</p>
    </div>
  );
}

function DistrictPanel({ district }: { district: DistrictCensus | null }) {
  if (!district) return <div className="p-4 text-gray-600 text-xs">Loading district data...</div>;

  const pop   = (district['Population'] as number) || 0;
  const male  = (district['Male'] as number) || 0;
  const female = (district['Female'] as number) || 0;
  const literate = (district['Literate'] as number) || 0;
  const sc    = (district['SC'] as number) || 0;
  const st    = (district['ST'] as number) || 0;
  const workers = (district['Workers'] as number) || 0;
  const households = (district['Households'] as number) || 0;
  const electricity = (district['Housholds_with_Electric_Lighting'] as number) || 0;
  const lpg   = (district['LPG_or_PNG_Households'] as number) || 0;
  const internet = (district['Households_with_Internet'] as number) || 0;

  const hindus    = (district['Hindus'] as number) || 0;
  const muslims   = (district['Muslims'] as number) || 0;
  const christians = (district['Christians'] as number) || 0;
  const sikhs     = (district['Sikhs'] as number) || 0;
  const buddhists = (district['Buddhists'] as number) || 0;
  const jains     = (district['Jains'] as number) || 0;

  const pct = (n: number, total: number) =>
    total > 0 ? parseFloat(((n / total) * 100).toFixed(1)) : 0;

  const literacyPct = pct(literate, pop);
  const sexRatio = male > 0 ? Math.round((female / male) * 1000) : 0;

  const religions = [
    { name: 'Hindu',     count: hindus,     color: '#f97316' },
    { name: 'Muslim',    count: muslims,    color: '#10b981' },
    { name: 'Christian', count: christians, color: '#3b82f6' },
    { name: 'Sikh',      count: sikhs,      color: '#a78bfa' },
    { name: 'Buddhist',  count: buddhists,  color: '#fbbf24' },
    { name: 'Jain',      count: jains,      color: '#f472b6' },
  ].filter(r => r.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="p-4">
      <Section title="Population">
        <DataRow label="Total" value={fmt(pop)} />
        <DataRow label="Male" value={`${fmt(male)} (${pct(male, pop)}%)`} />
        <DataRow label="Female" value={`${fmt(female)} (${pct(female, pop)}%)`} />
        <DataRow label="Sex Ratio" value={`${sexRatio} / 1000`} />
      </Section>

      <Section title="Literacy">
        <DataRow label="Literate" value={fmt(literate)} />
        <DataRow label="Rate" value={`${literacyPct}%`} />
        <MiniBar value={literacyPct} color="#f97316" />
        {(district['Graduate_Education'] as number) > 0 && (
          <DataRow label="Graduates" value={fmt((district['Graduate_Education'] as number))} />
        )}
      </Section>

      {religions.length > 0 && (
        <Section title="Religion (% of population)">
          {religions.map(r => (
            <div key={r.name} className="mb-2">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-400">{r.name}</span>
                <span className="text-white font-medium">{pct(r.count, pop)}%</span>
              </div>
              <MiniBar value={pct(r.count, pop)} color={r.color} />
            </div>
          ))}
        </Section>
      )}

      <Section title="Social">
        <DataRow label="SC" value={`${fmt(sc)} · ${pct(sc, pop)}%`} />
        <DataRow label="ST" value={`${fmt(st)} · ${pct(st, pop)}%`} />
        <DataRow label="Workers" value={`${fmt(workers)} · ${pct(workers, pop)}%`} />
      </Section>

      {households > 0 && (
        <Section title="Household Amenities">
          <DataRow label="Households" value={fmt(households)} />
          <div className="mt-1 space-y-1.5">
            {[
              { label: 'Electricity', value: pct(electricity, households), color: '#fbbf24' },
              { label: 'LPG / PNG',   value: pct(lpg, households),         color: '#10b981' },
              { label: 'Internet',    value: pct(internet, households),     color: '#3b82f6' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white font-medium">{item.value}%</span>
                </div>
                <MiniBar value={item.value} color={item.color} />
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

export default function MainLayout() {
  const [level, setLevel] = useState<DrillLevel>('national');
  const [activeLayer, setActiveLayer] = useState<MapLayer>('literacy');

  const [nationalStats, setNationalStats] = useState<NationalStats | null>(null);
  const [states, setStates] = useState<State[]>([]);

  const [selectedStateName, setSelectedStateName] = useState('');
  const [selectedStateData, setSelectedStateData] = useState<State | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);

  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedDistrictCensus, setSelectedDistrictCensus] = useState<DistrictCensus | null>(null);

  useEffect(() => {
    api.stats().then(setNationalStats).catch(() => {});
    api.states().then(d => setStates(d.states)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedStateName) { setDistricts([]); setSelectedStateData(null); return; }
    api.state(selectedStateName)
      .then(d => { setSelectedStateData(d.state); setDistricts(d.districts); })
      .catch(() => {});
  }, [selectedStateName]);

  function handleStateSelect(name: string) {
    setSelectedStateName(name);
    setSelectedDistrict(null);
    setSelectedDistrictCensus(null);
    setLevel(name ? 'state' : 'national');
  }

  async function handleDistrictSelect(district: District | null) {
    setSelectedDistrict(district);
    setSelectedDistrictCensus(null);
    if (district?.code) {
      setLevel('district');
      try {
        const census = await api.district(district.code);
        setSelectedDistrictCensus(census);
      } catch { /* ignore */ }
    } else {
      setLevel('state');
    }
  }

  function resetToNational() {
    setSelectedStateName('');
    setSelectedDistrict(null);
    setSelectedDistrictCensus(null);
    setLevel('national');
  }

  function resetToState() {
    setSelectedDistrict(null);
    setSelectedDistrictCensus(null);
    setLevel('state');
  }

  return (
    <div className="flex w-full h-full">

      {/* Sidebar */}
      <div className="w-72 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">

        {/* Breadcrumb */}
        <div className="px-4 py-2.5 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-1 text-xs flex-wrap">
            <button
              onClick={resetToNational}
              className={`transition-colors ${level === 'national' ? 'text-orange-400 font-semibold' : 'text-gray-400 hover:text-orange-400'}`}
            >
              India
            </button>
            {selectedStateName && (
              <>
                <span className="text-gray-700">›</span>
                <button
                  onClick={resetToState}
                  className={`transition-colors ${level === 'state' ? 'text-orange-400 font-semibold' : 'text-gray-400 hover:text-orange-400'}`}
                >
                  {toTitle(selectedStateName)}
                </button>
              </>
            )}
            {selectedDistrict && (
              <>
                <span className="text-gray-700">›</span>
                <span className="text-orange-400 font-semibold">{toTitle(selectedDistrict.name)}</span>
              </>
            )}
          </div>
        </div>

        {/* Dropdowns */}
        <div className="px-4 py-3 space-y-2.5 border-b border-gray-700 shrink-0">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">State</label>
            <select
              value={selectedStateName}
              onChange={e => handleStateSelect(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-orange-500 transition-colors cursor-pointer"
            >
              <option value="">— All India —</option>
              {[...states]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(s => (
                  <option key={s.name} value={s.name}>{toTitle(s.name)}</option>
                ))}
            </select>
          </div>

          {selectedStateName && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">District</label>
              <select
                value={selectedDistrict?.code || ''}
                onChange={e => {
                  const d = districts.find(d => d.code === e.target.value) || null;
                  handleDistrictSelect(d);
                }}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-orange-500 transition-colors cursor-pointer"
              >
                <option value="">— All Districts —</option>
                {[...districts]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(d => (
                    <option key={d.code} value={d.code}>{toTitle(d.name)}</option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Layer Selector */}
        <div className="px-4 py-3 border-b border-gray-700 shrink-0">
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Map Layer</label>
          <div className="grid grid-cols-2 gap-1.5">
            {LAYERS.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-center ${
                  activeLayer === l.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Panel */}
        <div className="flex-1 overflow-y-auto">
          {level === 'national' && <NationalPanel stats={nationalStats} />}
          {level === 'state' && <StatePanel state={selectedStateData} districts={districts} />}
          {level === 'district' && <DistrictPanel district={selectedDistrictCensus} />}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          level={level}
          selectedState={selectedStateName}
          selectedDistrict={selectedDistrict}
          layer={activeLayer}
          onDistrictClick={handleDistrictSelect}
        />
      </div>
    </div>
  );
}
