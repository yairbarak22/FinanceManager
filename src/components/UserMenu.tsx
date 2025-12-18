'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, ChevronDown, HelpCircle, RotateCcw, UserCog, Users } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

interface UserMenuProps {
  onOpenProfile?: () => void;
  onOpenAccountSettings?: () => void;
}

export default function UserMenu({ onOpenProfile, onOpenAccountSettings }: UserMenuProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { startTour } = useOnboarding();

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
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
      >
        {image ? (
          <img
            src={image}
            alt={name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
            <User className="w-4 h-4 text-pink-600" />
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
          {name || email}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-scale-in">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {name || 'משתמש'}
            </p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {onOpenProfile && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Users className="w-4 h-4 text-blue-500" />
                שיתוף חשבון
              </button>
            )}
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => {
                setIsOpen(false);
                startTour();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-pink-500" />
              הצג סיור מודרך
            </button>
            <button
              onClick={async () => {
                setIsOpen(false);
                // Reset onboarding status and start tour
                await fetch('/api/user/onboarding', { method: 'DELETE' });
                startTour();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-teal-500" />
              אפס והתחל מחדש
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => {
                setIsOpen(false);
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

