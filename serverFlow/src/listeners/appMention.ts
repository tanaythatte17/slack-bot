import type { App } from "@slack/bolt";

import { getRagAnswer } from "../rag/answer.ts";

export function registerAppMentionListener(app: App) {
  app.event("app_mention", async ({ event, say }) => {
    const question = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();

    if (!question) {
      await say({
        text: "Ask me anything about your company docs 👋",
        thread_ts: event.ts,
      });

      return;
    }

    await say({
      text: "🔍 Searching your docs...",
      thread_ts: event.ts,
    });

    try {
      const workspaceId = event.team;

      if (!workspaceId) {
        throw new Error("Missing workspace ID");
      }

      const answer = await getRagAnswer(question, workspaceId);

      await say({
        text: answer,
        thread_ts: event.ts,
      });
    } catch (error) {
      console.error("RAG error:", error);

      await say({
        text: "Something went wrong while searching your docs.",
        thread_ts: event.ts,
      });
    }
  });
}
