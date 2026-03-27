'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/app/lib/api';
import { DistrictCensus, SearchResult } from '@/app/types';
import SearchBar from './SearchBar';
import InfoPanel from './InfoPanel';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

interface Props {
  // kept for future server-side prop passing
}

export default function MainLayout(_props: Props) {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictCensus | null>(null);

  async function handleSearchSelect(result: SearchResult) {
    if (result.type === 'district' && result.code) {
      try {
        const d = await api.district(result.code);
        setSelectedDistrict(d);
      } catch { /* ignore */ }
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Search bar overlay */}
      <div className="absolute top-3 left-3 z-[1000] w-80">
        <SearchBar onSelect={handleSearchSelect} />
      </div>

      {/* Map */}
      <MapView onDistrictClick={setSelectedDistrict} />

      {/* District info panel */}
      <InfoPanel district={selectedDistrict} onClose={() => setSelectedDistrict(null)} />
    </div>
  );
}
