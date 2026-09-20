import type { Request, Response } from "express";
import { AppError } from "../../errors/AppError";
import {
  getInstrumentSearchService,
  getVerifiedInstrumentsService,
} from "../../services/business/instrument.service";
import { catchAsync } from "../../middleware/catchAsync";

export const getVerifiedInstruments = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid user Id",
    });
  }

  const instruments = await getVerifiedInstrumentsService(userId);

  return res.status(200).json({
    success: true,
    data: instruments,
  });
});

export const getInstrumentSearch = catchAsync(async (req: Request, res: Response) => {
  const { userId, input } = req.params;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid User ID",
    });
  }

  if (!input || typeof input !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid Input",
    });
  }

  const instruments = await getInstrumentSearchService(userId, input);

  return res.status(200).json({
    success: true,
    data: instruments,
  });
});
