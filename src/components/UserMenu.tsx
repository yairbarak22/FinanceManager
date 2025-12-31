'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, ChevronDown, UserCog, Users, Sparkles } from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { resetUser } from '@/lib/smartlook';
import { SensitiveData } from './common/SensitiveData';

interface UserMenuProps {
  onOpenProfile?: () => void;
  onOpenAccountSettings?: () => void;
}

export default function UserMenu({ onOpenProfile, onOpenAccountSettings }: UserMenuProps) {
  const { data: session } = useSession();
  const { startTour } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) {
    return null;
  }

  const { name, email, image } = session.user;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
      >
        {image ? (
          <img
            src={image}
            alt={name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
        )}
        <SensitiveData className="text-sm font-medium text-slate-700 hidden sm:block max-w-[120px] truncate">
          {name || email}
        </SensitiveData>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-scale-in">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-100">
            <SensitiveData as="p" className="text-sm font-medium text-slate-900 truncate">
              {name || 'משתמש'}
            </SensitiveData>
            <SensitiveData as="p" className="text-xs text-slate-500 truncate">
              {email}
            </SensitiveData>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {onOpenProfile && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserCog className="w-4 h-4 text-purple-500" />
                פרטים אישיים
              </button>
            )}
            {onOpenAccountSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAccountSettings();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Users className="w-4 h-4 text-blue-500" />
                שיתוף חשבון
              </button>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                startTour();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              סיור במערכת
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => {
                setIsOpen(false);
                // Reset Smartlook user identification before signing out
                resetUser();
                signOut({ callbackUrl: '/login' });
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              התנתק
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
