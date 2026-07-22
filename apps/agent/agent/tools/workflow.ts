// Enables the root-only `Workflow` tool: the model writes a small JS program
// (run in an isolated sandbox) that coordinates `agent` subagent calls —
// fan-out over a list, feed one result into the next, map-reduce — as one
// durable step.
export { ExperimentalWorkflow as default } from "eve/tools";
