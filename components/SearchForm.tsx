
import React, { useState } from 'react';

interface SearchFormProps {
  onScan: (city: string, keyword: string) => void;
  isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onScan, isLoading }) => {
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city && keyword) onScan(city, keyword);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-3xl border border-white/5 mb-8 flex flex-col md:flex-row gap-6 items-end shadow-2xl">
      <div className="flex-1 w-full group">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Geographic Sector</label>
        <div className="relative">
          <i className="fa-solid fa-location-crosshairs absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-blue-500 transition-colors"></i>
          <input
            type="text"
            placeholder="e.g. New York"
            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 outline-none transition-all font-bold text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="flex-1 w-full group">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Vertical / Keyword</label>
        <div className="relative">
          <i className="fa-solid fa-radar absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-blue-500 transition-colors"></i>
          <input
            type="text"
            placeholder="e.g. Roofers"
            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 outline-none transition-all font-bold text-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !city || !keyword}
        className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-900/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <i className="fa-solid fa-dna animate-spin"></i>
        ) : (
          <i className="fa-solid fa-bolt"></i>
        )}
        Initialize Campaign
      </button>
    </form>
  );
};
