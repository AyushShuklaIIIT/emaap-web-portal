import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const authorization = req.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  let adminUserId = "";
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error("JWT_SECRET is not configured");
    const claims = jwt.verify(token, secret);
    if (typeof claims === "object" && claims !== null && typeof claims.sub === "string") {
      adminUserId = claims.sub;
    }
  } catch {
    adminUserId = "";
  }
  if (!adminUserId) {
    return res.status(401).json({ success: false, error: "Admin authentication required" });
  }

  try {
    const { prisma } = await import("../lib/prisma");
    const admin = await prisma.user.findUnique({
      where: { user_id: adminUserId },
      select: { role: true, isActive: true },
    });
    if (!admin || admin.role !== "ADMIN" || !admin.isActive) {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    res.locals.adminUserId = adminUserId;
    return next();
  } catch (error) {
    console.error("Admin authentication failed", error);
    return res.status(503).json({ success: false, error: "Unable to verify admin access" });
  }
};
