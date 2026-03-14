import { User, UserCircle } from 'lucide-react';

interface OwnerCellProps {
  ownerId: string | null;
}

export default function OwnerCell({ ownerId }: OwnerCellProps) {
  if (!ownerId) {
    return (
      <div className="flex items-center justify-center h-9">
        <div className="w-8 h-8 rounded-full border border-dashed border-[#E8E8ED] flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-9">
      <div className="w-8 h-8 rounded-full bg-[#303150] flex items-center justify-center" title={ownerId}>
        <User className="w-4 h-4 text-white" strokeWidth={2} />
      </div>
    </div>
  );
}
