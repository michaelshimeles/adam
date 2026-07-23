import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
import { R as dispatchScheduleTask } from "../_libs/eve.mjs";
//#region #eve-schedule-task/eve.schedule.c2NoZWR1bGVzL21lbW9yeS1jb25zb2xpZGF0aW9uLm1k
const config = {
	"appRoot": "/home/ubuntu/repos/adam/apps/agent",
	"dev": false
};
var eve_schedule_default = {
	meta: { description: "Run eve schedule \"memory-consolidation\" from \"schedules/memory-consolidation.md\"." },
	async run(event) {
		return { result: await dispatchScheduleTask(event.name, config) };
	}
};
//#endregion
export { eve_schedule_default as default };
