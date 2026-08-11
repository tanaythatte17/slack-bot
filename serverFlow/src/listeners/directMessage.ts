import type { App } from "@slack/bolt";

import { getRagAnswer } from "../rag/answer.ts";

export function registerDirectMessageListener(app: App) {
  app.message(async ({ message, say }) => {
    if ("bot_id" in message) {
      return;
    }

    if (message.channel_type !== "im") {
      return;
    }

    if (!("text" in message) || !message.text) {
      return;
    }

    await say("🔍 Searching your docs...");

    try {
      const workspaceId = message.team;

      if (!workspaceId) {
        throw new Error("Missing workspace ID");
      }

      const answer = await getRagAnswer(message.text, workspaceId);

      await say(answer);
    } catch (error) {
      console.error("RAG error:", error);

      await say("Something went wrong while searching your docs.");
    }
  });
}
