import FunnelNavbar from '@/components/funnel/FunnelNavbar';

export default function InvestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-heebo)' }}>
      <FunnelNavbar />
      {children}
    </div>
  );
}
