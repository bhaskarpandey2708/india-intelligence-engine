'use client';
import { NationalStats } from '@/app/types';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 border-r border-gray-700 last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-white font-semibold text-sm mt-0.5">{value}</span>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

export default function StatsBar({ stats }: { stats: NationalStats }) {
  return (
    <div className="bg-gray-900 border-b border-gray-700 flex items-center overflow-x-auto">
      <Stat label="Population" value={fmt(stats.total_population)} />
      <Stat label="Districts" value={String(stats.total_districts)} />
      <Stat label="Avg Literacy" value={`${stats.avg_literacy_rate}%`} />
      <Stat label="Avg Sex Ratio" value={`${stats.avg_sex_ratio}/1000`} />
      <Stat label="Most Populous" value={stats.most_populous_district.name} />
      <Stat label="Highest Literacy" value={`${stats.highest_literacy_district.name} (${stats.highest_literacy_district.literacy}%)`} />
      <Stat label="Lowest Literacy" value={`${stats.lowest_literacy_district.name} (${stats.lowest_literacy_district.literacy}%)`} />
      <Stat label="Source" value="Census 2011" />
    </div>
  );
}
