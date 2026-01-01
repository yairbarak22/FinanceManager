'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function AcademyHero() {
  // Generate smooth growth path for the animated graph
  const generatePath = () => {
    const points: { x: number; y: number }[] = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * 100;
      // Exponential growth curve with some natural variation
      const baseY = 80 - (Math.pow(i / steps, 1.5) * 60);
      const variation = Math.sin(i * 0.5) * 3;
      const y = baseY + variation;
      points.push({ x, y });
    }
    
    return points.map((p, i) => 
      i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    ).join(' ');
  };

  const linePath = generatePath();

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/50 to-white" />
      
      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8"
        >
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">מרכז הידע הפיננסי</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6"
        >
          הכסף שלך יכול לעבוד
          <br />
          <span className="bg-gradient-to-l from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            יותר קשה
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          מדריכים פשוטים, כלים חכמים ותובנות ששוות כסף.
          <br className="hidden md:block" />
          בלי בלבולי מוח.
        </motion.p>

        {/* Animated Graph */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative w-full max-w-lg mx-auto h-32 md:h-40"
        >
          <svg
            viewBox="0 0 100 80"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <g className="opacity-20">
              {[20, 40, 60].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#94a3b8"
                  strokeWidth="0.3"
                  strokeDasharray="2,2"
                />
              ))}
            </g>

            {/* Gradient definition */}
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="40%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <motion.path
              d={`${linePath} L 100 80 L 0 80 Z`}
              fill="url(#areaGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            />

            {/* Animated line */}
            <motion.path
              d={linePath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
            />

            {/* End point glow */}
            <motion.circle
              cx="100"
              cy="20"
              r="3"
              fill="#22c55e"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 2.5 }}
            />
            <motion.circle
              cx="100"
              cy="20"
              r="6"
              fill="#22c55e"
              opacity="0.3"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.3, scale: 1 }}
              transition={{ duration: 0.3, delay: 2.5 }}
            />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}

