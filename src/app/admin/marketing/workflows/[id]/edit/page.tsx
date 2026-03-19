import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowBuilder from '@/components/admin/workflows/WorkflowBuilder';

interface PageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_TRIGGER_NODE = {
  id: 'trigger-1',
  type: 'TRIGGER' as const,
  position: { x: 250, y: 50 },
  data: {
    triggerType: 'MANUAL',
    segmentFilter: { type: 'all' },
    timing: 'immediate',
  },
};

export default async function WorkflowEditPage({ params }: PageProps) {
  const { id } = await params;

  const workflow = await prisma.automationWorkflow.findUnique({
    where: { id },
  });

  if (!workflow) notFound();

  const rawNodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  const rawEdges = Array.isArray(workflow.edges) ? workflow.edges : [];

  const nodes = rawNodes.length > 0 ? (rawNodes as unknown[]) : [DEFAULT_TRIGGER_NODE];
  const edges = rawEdges as unknown[];

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl lg:text-2xl font-bold text-[#303150] mb-0.5">
          {workflow.name}
        </h1>
        <p className="text-xs lg:text-sm text-[#7E7F90]">
          עריכת תהליך עבודה אוטומטי
        </p>
      </div>

      <ReactFlowProvider>
        <WorkflowBuilder
          initialNodes={nodes as any[]}
          initialEdges={edges as any[]}
          workflowId={id}
          initialStatus={workflow.status}
        />
      </ReactFlowProvider>
    </div>
  );
}
