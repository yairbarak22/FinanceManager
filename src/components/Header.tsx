'use client';

import { Plus, Upload } from 'lucide-react';
import UserMenu from './UserMenu';

interface HeaderProps {
  onNewTransaction: () => void;
  onImport: () => void;
}

export default function Header({ onNewTransaction, onImport }: HeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          הניהול הפיננסי שלי
        </h1>
        <p className="text-sm text-gray-500 hidden md:block">
          מעקב ושליטה מלאה על התקציב המשפחתי
        </p>
      </div>
      
      <div className="flex items-center gap-2 mr-auto">
        <button
          onClick={onImport}
          className="btn-secondary"
        >
          <Upload className="w-5 h-5" />
          <span className="hidden sm:inline">ייבוא</span>
        </button>
        <button
          onClick={onNewTransaction}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">עסקה חדשה</span>
        </button>
        <UserMenu />
      </div>
    </div>
  );
}
