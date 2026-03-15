import { z } from 'zod';

// ============================================
// NODE TYPES
// ============================================

export const NODE_TYPES = ['TRIGGER', 'EMAIL', 'DELAY', 'CONDITION'] as const;
export const NodeTypeSchema = z.enum(NODE_TYPES);

export const DELAY_UNITS = ['HOURS', 'DAYS'] as const;
export const DelayUnitSchema = z.enum(DELAY_UNITS);

export const CONDITION_TYPES = ['OPENED_EMAIL', 'CLICKED_LINK'] as const;
export const ConditionTypeSchema = z.enum(CONDITION_TYPES);

// ============================================
// NODE DATA SCHEMAS — one per node type
// ============================================

export const TRIGGER_TYPES = ['MANUAL', 'USER_REGISTERED', 'ADDED_TO_GROUP'] as const;
export const TriggerTypeSchema = z.enum(TRIGGER_TYPES);

export const TIMING_MODES = ['immediate', 'scheduled'] as const;
export const TimingModeSchema = z.enum(TIMING_MODES);

export const TriggerNodeDataSchema = z.object({
  triggerType: TriggerTypeSchema.default('MANUAL'),
  segmentFilter: z.any().optional(),
  timing: TimingModeSchema.default('immediate'),
  scheduledAt: z.string().optional(),
});

export const EmailNodeDataSchema = z.object({
  subject: z.string().max(200).default(''),
  htmlContent: z.string().default(''),
});

export const DelayNodeDataSchema = z.object({
  amount: z.number().int().positive('Delay must be at least 1'),
  unit: DelayUnitSchema,
});

export const ConditionNodeDataSchema = z.object({
  conditionType: ConditionTypeSchema,
  targetEmailNodeId: z.string().optional(),
});

// ============================================
// WORKFLOW NODE — discriminated union on `type`
// ============================================

const PositionSchema = z.object({ x: z.number(), y: z.number() });

const TriggerNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('TRIGGER'),
  position: PositionSchema,
  data: TriggerNodeDataSchema,
});

const EmailNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('EMAIL'),
  position: PositionSchema,
  data: EmailNodeDataSchema,
});

const DelayNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('DELAY'),
  position: PositionSchema,
  data: DelayNodeDataSchema,
});

const ConditionNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('CONDITION'),
  position: PositionSchema,
  data: ConditionNodeDataSchema,
});

export const WorkflowNodeSchema = z.discriminatedUnion('type', [
  TriggerNodeSchema,
  EmailNodeSchema,
  DelayNodeSchema,
  ConditionNodeSchema,
]);

// ============================================
// WORKFLOW EDGE — React Flow edge structure
// ============================================

export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

// ============================================
// WORKFLOW GRAPH — full DAG structure
// ============================================

export const WorkflowGraphSchema = z.object({
  nodes: z.array(WorkflowNodeSchema).min(1, 'Workflow must have at least one node'),
  edges: z.array(WorkflowEdgeSchema),
});

// ============================================
// INFERRED TYPESCRIPT TYPES
// ============================================

export type NodeType = z.infer<typeof NodeTypeSchema>;
export type DelayUnit = z.infer<typeof DelayUnitSchema>;
export type ConditionType = z.infer<typeof ConditionTypeSchema>;

export type TriggerNodeData = z.infer<typeof TriggerNodeDataSchema>;
export type EmailNodeData = z.infer<typeof EmailNodeDataSchema>;
export type DelayNodeData = z.infer<typeof DelayNodeDataSchema>;
export type ConditionNodeData = z.infer<typeof ConditionNodeDataSchema>;

export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;
export type WorkflowGraph = z.infer<typeof WorkflowGraphSchema>;

// Per-type node aliases for narrowed access
export type TriggerNode = z.infer<typeof TriggerNodeSchema>;
export type EmailNode = z.infer<typeof EmailNodeSchema>;
export type DelayNode = z.infer<typeof DelayNodeSchema>;
export type ConditionNode = z.infer<typeof ConditionNodeSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateWorkflowGraph(data: unknown): WorkflowGraph {
  return WorkflowGraphSchema.parse(data);
}

export function safeParseWorkflowGraph(data: unknown) {
  return WorkflowGraphSchema.safeParse(data);
}
