/**
 * Typed references to the builder-backend's public functions. Mirrors the
 * apps/web pattern: makeFunctionReference + hand-declared types, since the
 * generated api lives in another package.
 */
import { makeFunctionReference } from "convex/server";

export interface AgentTools {
  saveNote: boolean;
  listNotes: boolean;
  clearNotes: boolean;
  workflowStats: boolean;
  /** eve framework tools; optional on rows created before the toggles. */
  webFetch?: boolean;
  webSearch?: boolean;
  /** Assistant capability groups; optional on rows created before them. */
  memory?: boolean;
  skills?: boolean;
  reminders?: boolean;
  eventTriggers?: boolean;
  receipts?: boolean;
  extras?: boolean;
  delegation?: boolean;
}

export interface AgentSchedule {
  enabled: boolean;
  cron: string;
  prompt: string;
}

export interface AgentChannels {
  webhook: { enabled: boolean };
  /** Optional on rows created before the telegram channel existed. */
  telegram?: { enabled: boolean; allowedUserIds: string };
}

export type AgentStatus = "draft" | "deploying" | "live" | "failed" | "deleting";

export interface AgentSummary {
  _id: string;
  _creationTime: number;
  name: string;
  slug: string;
  model: string;
  instructions: string;
  tools: AgentTools;
  schedule: AgentSchedule;
  /** Optional on rows created before the channels section existed. */
  channels?: AgentChannels;
  status: AgentStatus;
  hasGatewayKey: boolean;
  hasTelegramToken?: boolean;
  hasComposioKey?: boolean;
  hasConvexDeployKey?: boolean;
  /** Optional on rows created before the timezone field existed. */
  timezone?: string;
  projectSlug?: string;
  deploymentName?: string;
  deploymentUrl?: string;
  dashboardUrl?: string;
  bundleVersion?: string;
  /** x-webhook-secret for the deployed webhook channel. */
  webhookSecret?: string;
  lastDeployedAt?: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export type JobStatus = "pending" | "running" | "succeeded" | "failed";

export interface DeployJob {
  _id: string;
  _creationTime: number;
  agentId: string;
  /** Absent on rows that predate the delete feature (= "deploy"). */
  kind?: "deploy" | "delete";
  status: JobStatus;
  step?: string;
  error?: string;
  workerId?: string;
  logCount: number;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface JobLogLine {
  seq: number;
  line: string;
  createdAt: number;
}

// Type alias (not interface) so it satisfies convex's DefaultFunctionArgs
// constraint, which needs an implicit index signature.
export type AgentConfigInput = {
  name: string;
  model: string;
  instructions: string;
  tools: Required<AgentTools>;
  timezone: string;
  schedule: AgentSchedule;
  channels: Required<AgentChannels>;
};

/**
 * Every dashboard call optionally carries the access secret; required when
 * the deployment sets BUILDER_DASHBOARD_SECRET (see lib/auth.svelte.ts).
 */
type DashboardAuth = { dashboardSecret?: string };

export const agentsApi = {
  list: makeFunctionReference<"query", DashboardAuth, AgentSummary[]>(
    "agents:list",
  ),
  get: makeFunctionReference<
    "query",
    DashboardAuth & { agentId: string },
    AgentSummary | null
  >("agents:get"),
  create: makeFunctionReference<
    "mutation",
    DashboardAuth &
      AgentConfigInput & {
        aiGatewayApiKey?: string;
        telegramBotToken?: string;
        composioApiKey?: string;
        convexDeployKey?: string;
      },
    string
  >("agents:create"),
  update: makeFunctionReference<
    "mutation",
    DashboardAuth &
      AgentConfigInput & {
        agentId: string;
        aiGatewayApiKey?: string;
        telegramBotToken?: string;
        composioApiKey?: string;
        convexDeployKey?: string;
      },
    null
  >("agents:update"),
  requestDeploy: makeFunctionReference<
    "mutation",
    DashboardAuth & { agentId: string },
    string
  >("agents:requestDeploy"),
  remove: makeFunctionReference<
    "mutation",
    DashboardAuth & { agentId: string },
    null
  >("agents:remove"),
  cancelJob: makeFunctionReference<
    "mutation",
    DashboardAuth & { agentId: string },
    null
  >("agents:cancelJob"),
  latestJob: makeFunctionReference<
    "query",
    DashboardAuth & { agentId: string },
    DeployJob | null
  >("agents:latestJob"),
  jobLogs: makeFunctionReference<
    "query",
    DashboardAuth & { jobId: string },
    JobLogLine[]
  >("agents:jobLogs"),
  workerHeartbeat: makeFunctionReference<
    "query",
    DashboardAuth,
    number | null
  >("agents:workerHeartbeat"),
};

export interface KeyValidationResult {
  ok: boolean;
  balance?: string;
  error?: string;
}

export const keysApi = {
  /** Server-side AI Gateway key check (the credits endpoint has no CORS). */
  validate: makeFunctionReference<
    "action",
    DashboardAuth & { apiKey: string },
    KeyValidationResult
  >("keys:validate"),
};

export const BUILDER_CONVEX_URL: string =
  (import.meta.env.VITE_BUILDER_CONVEX_URL as string | undefined) ??
  "https://rosy-goldfish-504.convex.cloud";

/**
 * Local-dev convenience: prefills the form's AI Gateway key field from
 * platform/builder-web/.env.local (gitignored). Empty when unset.
 */
export const PREFILL_GATEWAY_KEY: string =
  (import.meta.env.VITE_AI_GATEWAY_API_KEY as string | undefined)?.trim() ?? "";

export const MODEL_SUGGESTIONS = [
  "anthropic/claude-sonnet-5",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-5.2",
  "xai/grok-4.1",
];
