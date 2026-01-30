'use client';

import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

/**
 * SectionHeader - Fincheck style section header with title and subtitle
 * Used to separate dashboard sections with clear visual hierarchy
 */
export default function SectionHeader({
  title,
  subtitle,
  className = '',
  action
}: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-8 ${className}`}>
      <div className="flex flex-col gap-1">
        <h2 
          className="text-2xl font-bold leading-tight"
          style={{ 
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            color: 'var(--text-primary, #303150)'
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p 
            className="text-sm"
            style={{ 
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              color: 'var(--text-secondary, #7E7F90)'
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

