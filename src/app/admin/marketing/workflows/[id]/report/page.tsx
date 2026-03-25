import WorkflowReportDashboard from '@/components/admin/marketing/reports/WorkflowReportDashboard';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowReportPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <WorkflowReportDashboard workflowId={id} />
    </div>
  );
}
