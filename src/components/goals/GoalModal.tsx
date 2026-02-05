'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { 
  Plane, 
  Car, 
  Home, 
  GraduationCap, 
  Umbrella, 
  Wallet,
  Shield,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { FinancialGoal, UpdateGoalInput } from '@/lib/api/goals';

const GOAL_CATEGORIES = [
  { id: 'saving', label: 'חיסכון כללי', icon: Wallet },
  { id: 'home', label: 'דירה / בית', icon: Home },
  { id: 'car', label: 'רכב', icon: Car },
  { id: 'travel', label: 'נסיעות', icon: Plane },
  { id: 'education', label: 'לימודים', icon: GraduationCap },
  { id: 'vacation', label: 'חופשה', icon: Umbrella },
  { id: 'emergency', label: 'קרן חירום', icon: Shield },
];

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: UpdateGoalInput) => void | Promise<void>;
  goal: FinancialGoal;
  isSaving?: boolean;
}

export default function GoalModal({ 
  isOpen, 
  onClose, 
  onSave, 
  goal,
  isSaving 
}: GoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('saving');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount);
      setCurrentAmount(goal.currentAmount);
      setDeadline(new Date(goal.deadline).toISOString().split('T')[0]);
      setCategory(goal.category);
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSave({
      id: goal.id,
      name,
      targetAmount,
      currentAmount,
      deadline: new Date(deadline).toISOString(),
      category,
      icon: category,
    });
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#F7F7F8' }}>
          <h2 
            className="text-lg font-semibold"
            style={{ 
              color: '#303150',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            עריכת יעד
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[#F7F7F8]"
          >
            <X className="w-5 h-5" style={{ color: '#7E7F90' }} />
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#7E7F90' }}
            >
              שם היעד
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF]"
              style={{ 
                borderColor: '#E8E8ED',
                color: '#303150',
              }}
            />
          </div>
          
          {/* Category */}
          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#7E7F90' }}
            >
              קטגוריה
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                    style={{
                      backgroundColor: isSelected ? 'rgba(105, 173, 255, 0.15)' : '#F7F7F8',
                      border: isSelected ? '2px solid #69ADFF' : '2px solid transparent',
                    }}
                  >
                    <Icon 
                      className="w-4 h-4"
                      style={{ color: isSelected ? '#69ADFF' : '#7E7F90' }}
                    />
                    <span 
                      className="text-[10px]"
                      style={{ color: isSelected ? '#69ADFF' : '#7E7F90' }}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Target amount */}
          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#7E7F90' }}
            >
              סכום יעד
            </label>
            <div className="relative">
              <span 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: '#7E7F90' }}
              >
                ₪
              </span>
              <input
                type="number"
                min={1}
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                required
                className="w-full px-4 py-3 pr-8 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF] tabular-nums"
                style={{ 
                  borderColor: '#E8E8ED',
                  color: '#303150',
                  textAlign: 'left',
                  direction: 'ltr',
                }}
              />
            </div>
          </div>
          
          {/* Current amount */}
          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#7E7F90' }}
            >
              סכום נוכחי
            </label>
            <div className="relative">
              <span 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: '#7E7F90' }}
              >
                ₪
              </span>
              <input
                type="number"
                min={0}
                value={currentAmount}
                onChange={(e) => setCurrentAmount(Number(e.target.value))}
                className="w-full px-4 py-3 pr-8 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF] tabular-nums"
                style={{ 
                  borderColor: '#E8E8ED',
                  color: '#303150',
                  textAlign: 'left',
                  direction: 'ltr',
                }}
              />
            </div>
          </div>
          
          {/* Deadline */}
          <div>
            <label 
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#7E7F90' }}
            >
              תאריך יעד
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF]"
              style={{ 
                borderColor: '#E8E8ED',
                color: '#303150',
              }}
            />
          </div>
          
          {/* Recurring info if linked */}
          {goal.recurringTransaction && (
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(13, 186, 204, 0.1)' }}
            >
              <p 
                className="text-sm"
                style={{ color: '#0DBACC' }}
              >
                מקושר להוצאה קבועה: {goal.recurringTransaction.name} ({formatCurrency(goal.recurringTransaction.amount)}/חודש)
              </p>
            </div>
          )}
        </form>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 border-t" style={{ borderColor: '#F7F7F8' }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors"
            style={{ 
              backgroundColor: 'white',
              border: '1px solid #F7F7F8',
              color: '#303150',
            }}
          >
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: '#69ADFF',
              color: 'white',
            }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                שומר...
              </>
            ) : (
              'שמירה'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

