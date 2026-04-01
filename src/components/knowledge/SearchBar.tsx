'use client';

import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-xl mx-auto" role="search">
      <Search
        className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
        style={{ color: '#BDBDCB' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="חיפוש מאמרים..."
        aria-label="חיפוש מאמרים"
        className="w-full py-3.5 ps-12 pe-10 rounded-2xl text-[15px] outline-none transition-shadow duration-200"
        style={{
          background: '#FFFFFF',
          color: '#303150',
          fontFamily: 'var(--font-heebo)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute end-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-[#F7F7F8]"
          aria-label="נקה חיפוש"
        >
          <X className="w-4 h-4" style={{ color: '#7E7F90' }} />
        </button>
      )}
    </div>
  );
}
