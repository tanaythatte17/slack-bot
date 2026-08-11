import "./config/env.ts";
import { App } from "@slack/bolt";

import { pool } from "./config/db.ts";
import { registerAppMentionListener } from "./listeners/appMention.ts";
import { registerDirectMessageListener } from "./listeners/directMessage.ts";

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

registerAppMentionListener(app);
registerDirectMessageListener(app);

(async () => {
  await app.start(5000);

  console.log("⚡ Slack RAG bot running on port 5000");
})();
