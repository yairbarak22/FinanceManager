import CampaignReportDashboard from '@/components/admin/marketing/reports/CampaignReportDashboard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignReportPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <CampaignReportDashboard campaignId={id} />
    </div>
  );
}
