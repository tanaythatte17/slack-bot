import { App } from "@slack/bolt";
import dotenv from "dotenv";
import { Pool } from "pg";

import { getRagAnswer } from "./rag/answer.ts";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,

  authorize: async ({ teamId }) => {
    if (!teamId) {
      throw new Error("Missing team ID");
    }

    const result = await pool.query(
      `
      SELECT slack_bot_token
      FROM "Workspace"
      WHERE id = $1
      `,
      [teamId]
    );

    if (result.rows.length === 0) {
      throw new Error("Workspace not installed");
    }

    const workspace = result.rows[0];

    return {
      botToken: workspace.slack_bot_token,
    };
  },
});

app.event("app_mention", async ({ event, say }) => {
  const question = event.text
    .replace(/<@[A-Z0-9]+>/g, "")
    .trim();

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
  
    const answer = await getRagAnswer(
      question,
      workspaceId
    );

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

    const answer = await getRagAnswer(
      message.text,
      workspaceId
    );

    await say(answer);
  } catch (error) {
    console.error("RAG error:", error);

    await say(
      "Something went wrong while searching your docs."
    );
  }
});

(async () => {
  await app.start(5000);

  console.log("⚡ Slack RAG bot running on port 5000");
})();