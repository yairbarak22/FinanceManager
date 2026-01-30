'use client';

import React from 'react';
import { 
  Building2, 
  Bitcoin, 
  TrendingUp, 
  Briefcase, 
  Wallet,
  Home,
  CreditCard,
  Car,
  GraduationCap,
  Repeat,
  Zap,
  Wifi,
  Phone,
  Shield,
  Plus,
  ChevronLeft
} from 'lucide-react';

type ListType = 'assets' | 'liabilities' | 'recurring';

interface ListItem {
  id: string;
  name: string;
  amount: number;
  category?: string;
  icon?: string;
  type?: 'income' | 'expense';
  isActive?: boolean;
}

interface PortfolioListProps {
  title: string;
  items: ListItem[];
  listType: ListType;
  onAdd?: () => void;
  onItemClick?: (item: ListItem) => void;
  maxItems?: number;
  className?: string;
  emptyMessage?: string;
}

// Icon mapping for categories
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
    // Assets
    'real_estate': Building2,
    'stocks': TrendingUp,
    'crypto': Bitcoin,
    'pension': Briefcase,
    'savings': Wallet,
    'investment': TrendingUp,
    // Liabilities
    'mortgage': Home,
    'credit_card': CreditCard,
    'car_loan': Car,
    'student_loan': GraduationCap,
    'personal_loan': CreditCard,
    // Recurring
    'subscription': Repeat,
    'utilities': Zap,
    'internet': Wifi,
    'phone': Phone,
    'insurance': Shield,
    'salary': Wallet,
  };

  const Icon = iconMap[category?.toLowerCase()] || Wallet;
  return Icon;
};

// Background and icon colors based on list type - using Fincheck colors
const getIconStyles = (listType: ListType, type?: 'income' | 'expense') => {
  if (listType === 'recurring') {
    return type === 'income' 
      ? { background: 'rgba(13, 186, 204, 0.1)', color: '#0DBACC' }
      : { background: 'rgba(241, 138, 181, 0.1)', color: '#F18AB5' };
  }
  
  const styles: Record<ListType, { background: string; color: string }> = {
    assets: { background: 'rgba(13, 186, 204, 0.1)', color: '#0DBACC' },
    liabilities: { background: 'rgba(241, 138, 181, 0.1)', color: '#F18AB5' },
    recurring: { background: 'rgba(105, 173, 255, 0.1)', color: '#69ADFF' }
  };
  
  return styles[listType];
};

// Amount color based on list type - using Fincheck colors
const getAmountColor = (listType: ListType, type?: 'income' | 'expense') => {
  if (listType === 'recurring') {
    return type === 'income' ? '#0DBACC' : '#F18AB5';
  }
  
  const colors: Record<ListType, string> = {
    assets: '#0DBACC',      // Turquoise for positive
    liabilities: '#F18AB5', // Pink for negative
    recurring: '#303150'
  };
  
  return colors[listType];
};

/**
 * PortfolioList - Minimalist list component with 1.5px stroke icons
 */
export default function PortfolioList({
  title,
  items,
  listType,
  onAdd,
  onItemClick,
  maxItems = 5,
  className = '',
  emptyMessage = 'אין פריטים להצגה'
}: PortfolioListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const displayItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <div
      className={`bg-white rounded-3xl p-6 h-full flex flex-col ${className}`}
      style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 
          className="text-lg font-semibold"
          style={{ 
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            color: '#303150'
          }}
        >
          {title}
        </h3>
        {onAdd && (
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(105, 173, 255, 0.1)' }}
            aria-label={`הוסף ${title}`}
          >
            <Plus className="w-4 h-4" style={{ color: '#69ADFF' }} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {displayItems.length === 0 ? (
          <div 
            className="flex items-center justify-center h-32 text-sm"
            style={{ color: '#7E7F90' }}
          >
            {emptyMessage}
          </div>
        ) : (
          displayItems.map((item) => {
            const Icon = getCategoryIcon(item.category || '');
            const iconStyles = getIconStyles(listType, item.type);
            const amountColor = getAmountColor(listType, item.type);
            
            return (
              <button
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7F7F8] transition-colors text-right"
              >
                {/* Icon - 1.5px stroke */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconStyles.background, color: iconStyles.color }}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-medium text-sm truncate"
                    style={{ 
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      color: '#303150'
                    }}
                  >
                    {item.name}
                  </p>
                  {item.category && (
                    <p 
                      className="text-xs truncate"
                      style={{ color: '#7E7F90' }}
                    >
                      {item.category}
                    </p>
                  )}
                </div>
                
                {/* Amount - Turquoise for positive, Pink for negative */}
                <div className="flex-shrink-0 text-left">
                  <p 
                    className="font-semibold text-sm"
                    style={{ 
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      color: amountColor
                    }}
                  >
                    {listType === 'liabilities' ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Show more link */}
      {hasMore && (
        <button
          onClick={() => onItemClick?.(items[0])}
          className="mt-4 pt-4 border-t flex items-center justify-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ 
            borderColor: 'rgba(0, 0, 0, 0.08)',
            color: '#7E7F90' 
          }}
        >
          <span>הצג עוד {items.length - maxItems} פריטים</span>
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
