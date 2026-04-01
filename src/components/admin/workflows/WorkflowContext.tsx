'use client';

import { createContext, useContext } from 'react';

interface WorkflowContextValue {
  workflowId: string;
}

export const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function useWorkflowContext() {
  return useContext(WorkflowContext);
}
