import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
import { R as dispatchScheduleTask } from "../_libs/eve.mjs";
//#region #eve-schedule-task/eve.schedule.c2NoZWR1bGVzL3JlbWluZGVycy50cw
const config = {
	"appRoot": "/home/ubuntu/repos/adam/apps/agent",
	"dev": false
};
var eve_schedule_default = {
	meta: { description: "Run eve schedule \"reminders\" from \"schedules/reminders.ts\"." },
	async run(event) {
		return { result: await dispatchScheduleTask(event.name, config) };
	}
};
//#endregion
export { eve_schedule_default as default };
