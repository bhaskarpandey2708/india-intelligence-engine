'use client';
import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/app/lib/api';
import { SearchResult } from '@/app/types';

interface Props {
  onSelect: (result: SearchResult) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data.results.slice(0, 8));
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center bg-gray-800 border border-gray-600 rounded-lg px-3 py-2">
        <Search size={16} className="text-gray-400 mr-2 shrink-0" />
        <input
          className="bg-transparent text-white text-sm flex-1 outline-none placeholder-gray-500"
          placeholder="Search states, districts..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <span className="text-gray-500 text-xs">...</span>}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-700 flex items-center gap-3"
              onClick={() => { onSelect(r); setOpen(false); setQuery(''); }}
            >
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.type === 'state' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                {r.type}
              </span>
              <span className="text-white text-sm">{r.name}</span>
              {r.state && <span className="text-gray-400 text-xs">{r.state}</span>}
              <span className="text-gray-500 text-xs ml-auto">{(r.population / 1_000_000).toFixed(1)}M</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
