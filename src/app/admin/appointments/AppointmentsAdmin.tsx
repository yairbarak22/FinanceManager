'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Plus, Trash2, Phone, Mail, User, Clock, CalendarDays, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface SlotData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  appointment: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
  } | null;
}

interface AppointmentData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface Stats {
  total: number;
  booked: number;
  remaining: number;
  totalSlots: number;
}

export default function AppointmentsAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for creating slots
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('12:00');
  const [slotInterval, setSlotInterval] = useState(10);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, slotsRes] = await Promise.all([
        fetch('/api/admin/appointments'),
        fetch('/api/admin/appointments/slots'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        setAppointments(data.appointments);
      }

      if (slotsRes.ok) {
        const data = await slotsRes.json();
        setSlots(data.slots);
      }
    } catch (err) {
      console.error('Failed to fetch appointments data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotDate) return;

    setCreating(true);
    try {
      const res = await apiFetch('/api/admin/appointments/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: slotDate,
          startTime: slotStartTime,
          endTime: slotEndTime,
          intervalMinutes: slotInterval,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`נוצרו ${data.created} slots בהצלחה`);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'שגיאה ביצירת slots');
      }
    } catch {
      alert('שגיאה ביצירת slots');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('למחוק slot זה?')) return;

    try {
      const res = await apiFetch('/api/admin/appointments/slots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'שגיאה במחיקה');
      }
    } catch {
      alert('שגיאה במחיקה');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#303150]">קביעת פגישות</h1>
        </div>
        <button
          onClick={() => fetchData()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="רענן"
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">סה&quot;כ מקומות</p>
            <p className="text-2xl font-bold text-[#303150]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">נקבעו</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.booked}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">נותרו</p>
            <p className="text-2xl font-bold text-amber-600">{stats.remaining}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Slots שהוגדרו</p>
            <p className="text-2xl font-bold text-[#69ADFF]">{stats.totalSlots}</p>
          </div>
        </div>
      )}

      {/* Create Slots Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#303150] mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          הוספת זמנים פנויים
        </h2>
        <form onSubmit={handleCreateSlots} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">תאריך</label>
            <input
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">משעה</label>
            <input
              type="time"
              value={slotStartTime}
              onChange={(e) => setSlotStartTime(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">עד שעה</label>
            <input
              type="time"
              value={slotEndTime}
              onChange={(e) => setSlotEndTime(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">אינטרוול (דק&apos;)</label>
            <select
              value={slotInterval}
              onChange={(e) => setSlotInterval(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={creating || !slotDate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            הוסף
          </button>
        </form>
      </div>

      {/* Slots List */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#303150] mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Slots ({slots.length})
        </h2>
        {slots.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">עדיין לא הוגדרו זמנים</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                  slot.isBooked
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-[#303150]">
                    <CalendarDays className="w-4 h-4 inline-block me-1 opacity-50" />
                    {formatDate(slot.date)}
                  </span>
                  <span className="text-gray-600">
                    {slot.startTime} - {slot.endTime}
                  </span>
                  {slot.isBooked && slot.appointment && (
                    <span className="text-emerald-700 font-medium flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      {slot.appointment.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {slot.isBooked ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                      נקבע
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#303150] mb-4 flex items-center gap-2">
          <User className="w-4 h-4" />
          פגישות שנקבעו ({appointments.length})
        </h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">עדיין לא נקבעו פגישות</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-[#303150] flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {apt.name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span dir="ltr">{apt.phone}</span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {apt.email}
                    </p>
                  </div>
                  <div className="text-end space-y-1">
                    <p className="text-sm font-medium text-[#303150]">
                      {formatDate(apt.date)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {apt.startTime} - {apt.endTime}
                    </p>
                    <span className="inline-block text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      {apt.status === 'CONFIRMED' ? 'מאושר' : apt.status === 'COMPLETED' ? 'הושלם' : 'בוטל'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
