---
cron: "15 8 * * *"
---

Nightly memory consolidation. Review your long-term memory about the user
and tidy it. Work only through list_memories, remember, and forget; do not
message anyone.

1. Load everything with list_memories.
2. Merge duplicates: when several entries say the same thing, save one entry
   with the best phrasing (entity-centric, e.g. "User prefers window seats")
   using remember, then forget the redundant ones. Skip this when entries
   only look similar but carry distinct details.
3. Resolve contradictions: when two entries conflict, keep the more recent
   one (updatedAt) and forget the outdated one. If recency is unclear, keep
   both.
4. Promote stable patterns: a non-permanent fact that keeps showing up or is
   clearly durable (routines, relationships, strong preferences, ongoing
   projects) becomes one permanent entry (remember with permanent: true);
   forget the transient duplicates it replaces.
5. Prune: forget one-off context that is clearly spent (past events long
   over, short-lived states, completed errands). Keep anything with lasting
   value.

Be conservative: when in doubt, keep the memory. Never forget a permanent
entry unless it is directly superseded by a merged or newer version you just
saved. Aim for a small, high-signal set of edits, not a rewrite.
