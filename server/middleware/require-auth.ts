import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const requireAuth: RequestHandler = (req, res, next) => {
  const authorization = req.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Authentication required" });
  }

  try {
    const secret = process.env.JWT_SECRET ?? "";
    const claims = jwt.verify(token, secret);

    if (
      typeof claims === "object" &&
      claims !== null &&
      typeof claims.sub === "string"
    ) {
      (req as any).user = { user_id: claims.sub };
      return next();
    }

    return res.status(401).json({ success: false, error: "Invalid token" });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, error: "Authentication failed" });
  }
};
