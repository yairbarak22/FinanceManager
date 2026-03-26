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
          <div className="flex items-center">
            <PieChart
                  className="w-6 h-6 md:w-7 md:h-7 -ms-0.5"
                  style={{ color: '#2B4699' }}
                  strokeWidth={2.5}
                />
              <span
                className="text-2xl md:text-3xl font-black tracking-tight inline-flex items-center"
                style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
              >
                <span style={{ color: '#2B4699' }}>Net</span>My
                
              </span>
            </div>


          {/* Copyright */}
          <p
            className="text-xs"
            style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}
          >
            &copy; {new Date().getFullYear()} MyNeto. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
}
