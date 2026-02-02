
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
    if (city && keyword) {
      onScan(city, keyword);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-slate-700 mb-1">Target City</label>
        <div className="relative">
          <i className="fa-solid fa-location-dot absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="e.g. London"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-slate-700 mb-1">Business Keyword</label>
        <div className="relative">
          <i className="fa-solid fa-store absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="e.g. Plumbers"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !city || !keyword}
        className="w-full md:w-auto px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <i className="fa-solid fa-circle-notch animate-spin"></i>
        ) : (
          <i className="fa-solid fa-magnifying-glass"></i>
        )}
        Scan Leads
      </button>
    </form>
  );
};
