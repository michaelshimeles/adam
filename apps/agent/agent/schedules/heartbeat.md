---
cron: "0 * * * *"
---

Check workflow health with the workflow_stats tool. If any queue jobs are
dead, or any recent run failed, save a short incident note with save_note
(prefix it with "[heartbeat]"). If everything is healthy, finish without
saving anything.
