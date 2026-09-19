import type { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const catchAsync = (fn: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      console.error(err);
      
      const statusCode = err.statusCode || (err instanceof AppError ? err.statusCode : 500);
      const message = err.message || "Internal Server Error";

      if (err instanceof AppError || err.name === "ReviewError" || statusCode < 500) {
        return res.status(statusCode).json({
          success: false,
          message: message,
          error: message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: "Internal Server Error",
      });
    }
  };
};
