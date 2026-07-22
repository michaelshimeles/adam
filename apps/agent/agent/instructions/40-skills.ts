import { defineDynamic, defineInstructions } from "eve/instructions";

import { backend, convexClient } from "../lib/convex";

interface StoredSkill {
  name: string;
  description: string;
  markdown: string;
}

// Inlines every chat-created skill (saved via the create_skill tool) into
// the session's instructions. The saved procedures are short, so inlining is
// cheaper than materializing files. Resolving on session.started means a
// skill created mid-conversation applies from the next session onward.
export default defineDynamic({
  events: {
    "session.started": async () => {
      let skills: StoredSkill[];
      try {
        skills = (await convexClient().query(
          backend.skillsList,
          {},
        )) as StoredSkill[];
      } catch {
        return null;
      }
      if (skills.length === 0) return null;

      const sections = skills.map(
        (skill) =>
          `### ${skill.name}\nWhen to use: ${skill.description}\n\n${skill.markdown}`,
      );

      return defineInstructions({
        markdown: `
## Saved skills

The user has saved these reusable procedures. When a request matches a
skill's "When to use" line, follow that skill's steps.

${sections.join("\n\n")}
        `.trim(),
      });
    },
  },
});
