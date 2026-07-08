import { disableTool } from "eve/tools";

// This demo keeps the host sandbox-free (no Docker requirement); the agent
// works through its Convex tools instead of a shell.
export default disableTool();
