import { defineDynamic, defineInstructions } from "eve/instructions";

const TELEGRAM_NOTE = `
This conversation is over Telegram. Write in plain text only: Telegram renders
markdown literally, so never use #, *, **, backticks, tables, or [links](url).
Short paragraphs and simple dashes are fine.
`.trim();

const WEB_NOTE = `
This conversation renders full markdown: headings, bold, lists, tables, code
blocks, and links all display properly. Use them when they make the answer
clearer. Put code and commands in fenced code blocks. Keep prose concise;
formatting replaces filler, not adds to it.
`.trim();

// The Telegram channel authenticates with its webhook secret; everything
// else (web chat, webhook channel, proactive sessions) reaches a
// markdown-capable surface.
export default defineDynamic({
  events: {
    "turn.started": (_event, ctx) => {
      const authenticator = ctx.session.auth.current?.authenticator ?? "";
      const telegram = authenticator === "telegram-webhook";
      return defineInstructions({ markdown: telegram ? TELEGRAM_NOTE : WEB_NOTE });
    },
  },
});
