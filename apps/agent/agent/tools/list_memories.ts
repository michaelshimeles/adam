import { defineTool } from "eve/tools";
import { z } from "zod";

import { backend, convexClient } from "../lib/convex";

export default defineTool({
  description:
    "List every saved long-term memory with its id. Use for a full inventory ('what do you know about me?') or to find ids for forget.",
  inputSchema: z.object({}),
  async execute() {
    const memories = await convexClient().query(backend.memoriesList, {});
    return { memories };
  },
});
