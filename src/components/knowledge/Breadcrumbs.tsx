'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[12px] flex-wrap"
      style={{ fontFamily: 'var(--font-heebo)' }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronLeft className="w-3 h-3" style={{ color: '#D1D5DB' }} />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="transition-colors duration-150 hover:text-[#2563EB]"
                style={{ color: '#9CA3AF' }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{ color: isLast ? '#9CA3AF' : '#9CA3AF' }}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
