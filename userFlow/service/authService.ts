import axios from "axios";
import {prisma} from "../lib/prisma"
import { generateToken } from "../utils/generateToken"
import crypto from "crypto";

export const getSlackAuthUrlService = async () => {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: "openid profile email",
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
    response_type: "code",
  });

  return `https://slack.com/openid/connect/authorize?${params.toString()}`;
};

export const handleSlackCallbackService = async (code: string, res: any) => {
    const tokenRes = await axios.post(
      "https://slack.com/api/openid.connect.token",
      new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { id_token, access_token } = tokenRes.data;
    const userRes = await axios.get(
        "https://slack.com/api/openid.connect.userInfo",
        {
            headers: {
            Authorization: `Bearer ${access_token}`,
            },
        }
    );

    const user = userRes.data;
    console.log("Authenticated user:", user);
    const slackId = user.sub;
    const email = user.email;
    const name = user.name;
    const avatar = user.picture;

    const teamId = user["https://slack.com/team_id"];
    const teamName = user["https://slack.com/team_name"];
    
    const dbUser = await prisma.user.upsert({
    where: { slack_id: slackId },
    update: { email, name, avatar },
    create: { slack_id: slackId, email, name, avatar },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: teamId },
    update: { team_name: teamName },
    create: {
      id: teamId,
      team_name: teamName,
      slack_bot_token: "",
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      user_id_workspace_id: {
        user_id: dbUser.id,
        workspace_id: workspace.id,
      },
    },
    update: {},
    create: {
      user_id: dbUser.id,
      workspace_id: workspace.id,
      role: "admin",
    },
  });

  generateToken({ userId: dbUser.id, workspaceId: workspace.id }, res);
}

export const getNotionAuthUrlService = async (req: any) => {
  const state = crypto.randomUUID();

  await prisma.oAuthState.create({
    data: {
      state,
      userId: req.user.id,
      workspaceId: req.user.workspaceId,
    }
  });

  const params = new URLSearchParams({
    client_id: process.env.NOTION_CLIENT_ID!,
    response_type: "code",
    owner: "user",
    redirect_uri: process.env.NOTION_REDIRECT_URI!,
    state,
  });

  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
};

export const handleNotionCallbackService = async (code: string, state: string) => {
  // 1. Validate state
  const record = await prisma.oAuthState.findUnique({
    where: { state }
  });

  if (!record) {
    throw new Error("Invalid or expired state");
  }

  const { workspaceId } = record;

  // 2. Exchange code for token
  const res = await axios.post(
    "https://api.notion.com/v1/oauth/token",
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.NOTION_REDIRECT_URI!,
    },
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/json",
      },
    }
  );

  const notionData = res.data;

  console.log("Notion OAuth response:", notionData);

  // 3. Store tokens in workspace
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      notion_token: notionData.access_token,
      notion_refresh_token: notionData.refresh_token,
      notion_workspace_id: notionData.workspace_id,
    },
  });

  // 4. Cleanup state (VERY IMPORTANT)
  await prisma.oAuthState.delete({
    where: { state }
  });

  return { success: true };
};

export const getSlackInstallUrlService = async (req: any) => {
  const state = crypto.randomUUID();

  await prisma.oAuthState.create({
    data: {
      state,
      userId: req.user.id,
      workspaceId: req.user.workspaceId,
    },
  });

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: [
      "app_mentions:read",
      "channels:history",
      "chat:write",
      "im:history",
    ].join(","),
    redirect_uri: process.env.SLACK_BOT_REDIRECT_URI!,
    state,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
};

export const handleSlackInstallCallbackService = async (
  code: string,
  state: string
) => {
  const tokenRes = await axios.post(
    "https://slack.com/api/oauth.v2.access",
    new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      redirect_uri: process.env.SLACK_BOT_REDIRECT_URI!,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const data = tokenRes.data;

  if (!data.ok) {
    throw new Error(data.error);
  }

  const record = await prisma.oAuthState.findUnique({
    where: { state },
  });

  if (!record) {
    throw new Error("Invalid or expired state");
  }

  const { workspaceId } = record;

  if (data.team.id !== workspaceId) {
    throw new Error("Slack workspace does not match your session");
  }

  const workspaceName = data.team.name;
  const botToken = data.access_token;
  const botUserId = data.bot_user_id;

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      team_name: workspaceName,
      slack_bot_token: botToken,
      slack_bot_user_id: botUserId,
    },
  });

  await prisma.oAuthState.delete({
    where: { state },
  });

  return workspace;
};