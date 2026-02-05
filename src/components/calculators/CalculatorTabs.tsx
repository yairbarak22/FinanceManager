'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  Banknote, 
  Home, 
  Flame, 
  Building2, 
  Shield, 
  GraduationCap,
  LucideIcon 
} from 'lucide-react';
import SalaryCalc from './SalaryCalc';
import BuyVsRentCalc from './BuyVsRentCalc';
import FIRECalc from './FIRECalc';
import MortgageCalc from './MortgageCalc';
import EmergencyFundCalc from './EmergencyFundCalc';
import EducationFundCalc from './EducationFundCalc';

interface CalculatorTab {
  id: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  component: React.ComponentType<{ showHeader?: boolean }>;
}

const CALCULATOR_TABS: CalculatorTab[] = [
  {
    id: 'salary',
    label: 'נטו/ברוטו',
    icon: Banknote,
    iconBg: 'bg-[#FFE4EC]',
    iconColor: 'text-[#F18AB5]',
    component: SalaryCalc,
  },
  {
    id: 'buy-vs-rent',
    label: 'קנייה מול שכירות',
    icon: Home,
    iconBg: 'bg-[#B4F1F1]',
    iconColor: 'text-[#0DBACC]',
    component: BuyVsRentCalc,
  },
  {
    id: 'fire',
    label: 'FIRE',
    icon: Flame,
    iconBg: 'bg-[#FFE4A0]',
    iconColor: 'text-[#E9A800]',
    component: FIRECalc,
  },
  {
    id: 'mortgage',
    label: 'משכנתא',
    icon: Building2,
    iconBg: 'bg-[#D4E4FF]',
    iconColor: 'text-[#69ADFF]',
    component: MortgageCalc,
  },
  {
    id: 'emergency',
    label: 'קרן חירום',
    icon: Shield,
    iconBg: 'bg-[#E3D6FF]',
    iconColor: 'text-[#9F7FE0]',
    component: EmergencyFundCalc,
  },
  {
    id: 'education',
    label: 'קרן לימודים',
    icon: GraduationCap,
    iconBg: 'bg-[#D4E4FF]',
    iconColor: 'text-[#69ADFF]',
    component: EducationFundCalc,
  },
];

interface CalculatorTabsProps {
  className?: string;
}

export default function CalculatorTabs({ className = '' }: CalculatorTabsProps) {
  const [activeTab, setActiveTab] = useState(CALCULATOR_TABS[0].id);

  const activeCalculator = CALCULATOR_TABS.find(tab => tab.id === activeTab);
  const ActiveComponent = activeCalculator?.component;

  return (
    <div className={className}>
      {/* Tab Bar */}
      <div className="bg-white rounded-3xl p-2 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap gap-2">
          {CALCULATOR_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-xl
                  transition-colors duration-200 text-sm font-medium
                  ${isActive 
                    ? 'bg-[#F7F7F8] text-[#303150]' 
                    : 'text-[#7E7F90] hover:bg-[#F7F7F8]/50'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-7 h-7 ${tab.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${tab.iconColor}`} />
                </div>
                <span>{tab.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-[#F7F7F8] rounded-xl -z-10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {ActiveComponent && <ActiveComponent showHeader />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

