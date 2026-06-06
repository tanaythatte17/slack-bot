import jwt from "jsonwebtoken";
import {prisma} from "../lib/prisma"

export const protectRoute = async (req: any, res: any, next: any) => {
  try {
    let token;

    // 1. Extract token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token" });
    }

    // 2. Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (!decoded?.userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // 3. Fetch user from DB (Prisma)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 4. (IMPORTANT) Validate workspace access

    // if (decoded.workspaceId) {
    //   const membership = await prisma.workspaceMember.findUnique({
    //     where: {
    //       user_id_workspace_id: {
    //         user_id: decoded.userId,
    //         workspace_id: decoded.workspaceId,
    //       },
    //     },
    //   });

    //   if (!membership) {
    //     return res.status(403).json({ error: "Access denied to workspace" });
    //   }
    // }

    // 5. Attach to request
    req.user = {
      id: user.id,
      workspaceId: decoded.workspaceId,
    };

    next();
  } catch (error: any) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ error: "Unauthorized" });
  }
};