import RoadmapBoard from '@/components/admin/roadmap/RoadmapBoard';

export default function AdminRoadmapPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#303150] mb-0.5">מפת דרכים</h1>
          <p className="text-xs lg:text-sm text-[#7E7F90]">ניהול משימות ותכנון פיתוח</p>
        </div>
      </div>

      {/* Board */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 lg:p-6">
        <RoadmapBoard />
      </div>
    </div>
  );
}
