import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
import { R as dispatchScheduleTask } from "../_libs/eve.mjs";
//#region #eve-schedule-task/eve.schedule.c2NoZWR1bGVzL2hlYXJ0YmVhdC5tZA
const config = {
	"appRoot": "/workspace/apps/agent",
	"dev": false
};
var eve_schedule_default = {
	meta: { description: "Run eve schedule \"heartbeat\" from \"schedules/heartbeat.md\"." },
	async run(event) {
		return { result: await dispatchScheduleTask(event.name, config) };
	}
};
//#endregion
export { eve_schedule_default as default };
