
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
    <form onSubmit={handleSubmit} className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-white/5 mb-8 flex flex-col md:flex-row gap-8 items-end shadow-2xl backdrop-blur-md transition-all hover:border-white/10">
      <div className="flex-1 w-full group">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Target Sector Geography</label>
        <div className="relative">
          <i className="fa-solid fa-location-crosshairs absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors"></i>
          <input
            type="text"
            placeholder="Search City (e.g. London)"
            className="w-full pl-14 pr-6 py-5 bg-slate-800/40 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 outline-none transition-all font-black text-sm text-white placeholder:text-slate-600"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="flex-1 w-full group">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Market Vertical</label>
        <div className="relative">
          <i className="fa-solid fa-radar absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors"></i>
          <input
            type="text"
            placeholder="e.g. Boutique Hotels"
            className="w-full pl-14 pr-6 py-5 bg-slate-800/40 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800 outline-none transition-all font-black text-sm text-white placeholder:text-slate-600"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !city || !keyword}
        className="w-full md:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-4 active:scale-95"
      >
        {isLoading ? (
          <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
        ) : (
          <i className="fa-solid fa-bolt text-sm"></i>
        )}
        Launch Campaign
      </button>
    </form>
  );
};
