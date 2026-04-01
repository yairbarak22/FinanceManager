'use client';

import { CheckCircle2, Play, Clock } from 'lucide-react';

interface VideoEmbedProps {
  youtubeId: string;
  title: string;
  duration: string;
  bullets?: string[];
}

export default function VideoEmbed({ youtubeId, title, duration, bullets }: VideoEmbedProps) {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&iv_load_policy=3`;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#F6F7F9',
        border: '1px solid #EAEDF0',
      }}
    >
      {/* Video */}
      <div className="relative w-full rounded-t-2xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={embedUrl}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>

      {/* Info */}
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(37,99,235,0.08)' }}
          >
            <Play className="w-4 h-4" style={{ color: '#2563EB' }} fill="#2563EB" />
          </div>
          <h4
            className="text-[14px] font-bold flex-1"
            style={{ color: '#1A1D26', fontFamily: 'var(--font-heebo)' }}
          >
            {title}
          </h4>
          <span
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium flex-shrink-0"
            style={{ background: 'rgba(37,99,235,0.06)', color: '#2563EB' }}
          >
            <Clock className="w-3 h-3" />
            {duration}
          </span>
        </div>

        {bullets && bullets.length > 0 && (
          <div>
            <p className="text-[12px] font-semibold mb-2" style={{ color: '#9CA3AF' }}>
              מה תלמדו בסרטון:
            </p>
            <ul className="space-y-2">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: '#0DBACC' }}
                    strokeWidth={2}
                  />
                  <span className="text-[13px] leading-relaxed" style={{ color: '#4B5563' }}>
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
