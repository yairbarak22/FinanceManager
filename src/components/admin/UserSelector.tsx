'use client';

import { useState, useEffect } from 'react';
import { Search, Check, X, User } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface UserSelectorProps {
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
}

export default function UserSelector({ selectedUserIds, onChange }: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            (user.name && user.name.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/admin/users');

      if (!res.ok) {
        setError('שגיאה בטעינת המשתמשים');
        return;
      }

      const data = await res.json();
      const allUsers = (data.users || []).filter((u: User) => u.email);
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch {
      setError('שגיאה בטעינת המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const selectAll = () => {
    onChange(filteredUsers.map((u) => u.id));
  };

  const deselectAll = () => {
    const filteredIds = filteredUsers.map((u) => u.id);
    onChange(selectedUserIds.filter((id) => !filteredIds.includes(id)));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-[#69ADFF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-[#7E7F90]">טוען משתמשים...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F18AB5]/10 border border-[#F18AB5]/30 rounded-xl p-4 text-center">
        <p className="text-sm text-[#303150]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7E7F90]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חפש לפי שם או אימייל..."
          className="w-full pr-12 pl-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent"
        />
      </div>

      {/* Selection Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#7E7F90]">
          נבחרו: <span className="font-bold text-[#303150]">{selectedUserIds.length}</span> משתמשים
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-1.5 text-sm bg-[#F7F7F8] text-[#303150] rounded-lg hover:bg-[#E8E8ED] transition-colors"
          >
            בחר הכל
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="px-3 py-1.5 text-sm bg-[#F7F7F8] text-[#303150] rounded-lg hover:bg-[#E8E8ED] transition-colors"
          >
            בטל הכל
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="border border-[#E8E8ED] rounded-xl max-h-96 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-[#BDBDCB] mx-auto mb-3" />
            <p className="text-sm text-[#7E7F90]">לא נמצאו משתמשים</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F7F7F8]">
            {filteredUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-[#F7F7F8] transition-colors text-right ${
                    isSelected ? 'bg-[#69ADFF]/5' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isSelected ? 'text-[#303150]' : 'text-[#7E7F90]'}`}>
                      {user.name || 'ללא שם'}
                    </p>
                    <p className="text-sm text-[#BDBDCB] truncate">{user.email}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-[#69ADFF] border-[#69ADFF]'
                        : 'border-[#E8E8ED] bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

