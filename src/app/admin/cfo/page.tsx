import { getCfoData } from '@/actions/admin-cfo-actions';
import CfoBoard from '@/components/admin/cfo/CfoBoard';
import CfoHeaderButton from '@/components/admin/cfo/CfoHeaderButton';

export default async function AdminCfoPage() {
  const cfoData = await getCfoData();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#303150] mb-0.5">
            ניהול פיננסי (CFO)
          </h1>
          <p className="text-xs lg:text-sm text-[#7E7F90]">
            מעקב תזרים מזומנים, מנויים ותנועות חד-פעמיות
          </p>
        </div>
        <CfoHeaderButton />
      </div>

      <div
        className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 lg:p-6"
        dir="rtl"
      >
        <CfoBoard initialData={cfoData} />
      </div>
    </div>
  );
}
