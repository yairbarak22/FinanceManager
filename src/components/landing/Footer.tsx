'use client';

import { PieChart } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (type: 'terms' | 'privacy') => void;
}

export default function Footer({ onOpenLegal }: FooterProps) {
  return (
    <footer style={{ background: '#F5F5F7', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Logo */}
          <div className="flex items-center gap-0">
            <PieChart
              className="w-6 h-6"
              style={{ color: '#2B4699' }}
              strokeWidth={3}
            />
            <span
              className="text-xl font-black tracking-tight"
              style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
            >
              NET
            </span>
          </div>


          {/* Copyright */}
          <p
            className="text-xs"
            style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}
          >
            &copy; {new Date().getFullYear()} myNETO. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
}
