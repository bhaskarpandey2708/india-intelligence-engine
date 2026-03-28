import StatsBar from '@/app/components/StatsBar';
import MainLayout from '@/app/components/MainLayout';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      <header className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-bold text-lg">🇮🇳</span>
          <h1 className="text-white font-bold text-base tracking-tight">India Intelligence Engine</h1>
          <span className="text-gray-600 text-xs ml-2">Census 2011</span>
        </div>
      </header>

      <StatsBar />

      <div className="flex-1 overflow-hidden">
        <MainLayout />
      </div>
    </div>
  );
}
