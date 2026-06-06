import { getNotionAuthUrlService, getSlackAuthUrlService, handleSlackCallbackService, handleNotionCallbackService, getSlackInstallUrlService, handleSlackInstallCallbackService } from "../service/authService";
import { prisma } from "../lib/prisma";

export const getSlackAuthUrl = async (req: any, res: any) => {
    try{
        const result = await getSlackAuthUrlService();
        res.status(200).json({ authUrl: result });
    } catch (error) {
        console.error("Error occurred while fetching Slack auth URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const handleSlackCallback = async (req: any, res: any) => {
    // This function will handle the callback from Slack after user authentication
    try{
        const { code } = req.query;
        await handleSlackCallbackService(code, res);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (error) {
        console.error("Error occurred while handling Slack callback:", error);
        res.redirect(`${process.env.FRONTEND_URL}/auth`);
    }
}

export const getNotionAuthUrl = async (req: any, res: any) => {
    try{
        const result = await getNotionAuthUrlService(req);
        res.status(200).json({ authUrl: result });
    } catch (error) {
        console.error("Error occurred while fetching Notion auth URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getSession = async (req: any, res: any) => {
    const workspace = await prisma.workspace.findUnique({
        where: { id: req.user.workspaceId },
        select: { team_name: true, notion_token: true, slack_bot_token: true },
    });

    const slackBotToken = workspace?.slack_bot_token?.trim() ?? "";

    res.status(200).json({
        userId: req.user.id,
        workspaceId: req.user.workspaceId,
        workspaceName: workspace?.team_name ?? null,
        notionConnected: Boolean(workspace?.notion_token),
        slackConnected: slackBotToken.length > 0,
    });
};

export const handleNotionCallback = async (req: any, res: any) => {
    try{
        const { code, state } = req.query;
        await handleNotionCallbackService(code, state);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (error) {
        console.error("Error occurred while handling Notion callback:", error);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    }
}

export const getSlackBotUrl = async (req: any, res: any) => {
    try{
        const result = await getSlackInstallUrlService(req);
        res.status(200).json({ authUrl: result });
    } catch (error) {
        console.error("Error occurred while fetching Slack auth URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const handleSlackBotCallback = async (req: any, res: any) => {
    try{
        const { code, state } = req.query;
        await handleSlackInstallCallbackService(code, state);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (error) {
        console.error("Error occurred while handling Slack bot callback:", error);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    }
}