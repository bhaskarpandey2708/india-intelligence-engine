'use client';
import { DistrictCensus, State } from '@/app/types';
import { X } from 'lucide-react';

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-700 last:border-0">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="text-white text-xs font-medium">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{title}</h3>
      {children}
    </div>
  );
}

interface Props {
  district: DistrictCensus | null;
  onClose: () => void;
}

export default function InfoPanel({ district, onClose }: Props) {
  if (!district) return null;

  const pop = district['Population'] as number || 0;
  const male = district['Male'] as number || 0;
  const female = district['Female'] as number || 0;
  const literate = district['Literate'] as number || 0;
  const literacyRate = pop > 0 ? ((literate / pop) * 100).toFixed(1) : '—';
  const sexRatio = male > 0 ? Math.round((female / male) * 1000) : '—';

  return (
    <div className="absolute top-4 right-4 z-[1000] w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-start justify-between">
        <div>
          <h2 className="text-white font-bold text-base">{district['District name'] as string}</h2>
          <p className="text-gray-400 text-xs mt-0.5">{district['State name'] as string}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white ml-2 mt-0.5">
          <X size={16} />
        </button>
      </div>

      <div className="px-4 py-3 overflow-y-auto max-h-[70vh]">
        <Section title="Population">
          <Row label="Total" value={pop} />
          <Row label="Male" value={male} />
          <Row label="Female" value={female} />
          <Row label="Sex Ratio (per 1000)" value={sexRatio} />
        </Section>

        <Section title="Education">
          <Row label="Literate" value={literate} />
          <Row label="Literacy Rate" value={`${literacyRate}%`} />
          <Row label="Graduates" value={district['Graduate_Education'] as number || 0} />
        </Section>

        <Section title="Social">
          <Row label="SC Population" value={district['SC'] as number || 0} />
          <Row label="ST Population" value={district['ST'] as number || 0} />
          <Row label="Workers" value={district['Workers'] as number || 0} />
        </Section>

        <Section title="Religion">
          <Row label="Hindus" value={district['Hindus'] as number || 0} />
          <Row label="Muslims" value={district['Muslims'] as number || 0} />
          <Row label="Christians" value={district['Christians'] as number || 0} />
          <Row label="Sikhs" value={district['Sikhs'] as number || 0} />
          <Row label="Buddhists" value={district['Buddhists'] as number || 0} />
          <Row label="Jains" value={district['Jains'] as number || 0} />
        </Section>

        <Section title="Households">
          <Row label="Total Households" value={district['Households'] as number || 0} />
          <Row label="With Electricity" value={district['Housholds_with_Electric_Lighting'] as number || 0} />
          <Row label="With LPG/PNG" value={district['LPG_or_PNG_Households'] as number || 0} />
          <Row label="With Internet" value={district['Households_with_Internet'] as number || 0} />
        </Section>
      </div>
    </div>
  );
}
