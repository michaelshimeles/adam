import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
import { i as gateway } from "./@ai-sdk/gateway+[...].mjs";
import "./ai.mjs";
export { gateway };
