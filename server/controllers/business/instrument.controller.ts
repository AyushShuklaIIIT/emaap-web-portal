import { Request, Response } from "express";
import {
  getInstrumentSearchService,
  getVerifiedInstrumentsService,
} from "../../services/business/instrument.service";
import { AppError } from "../../errors/AppError";

export const getVerifiedInstruments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user Id",
      });
    }

    const instruments = await getVerifiedInstrumentsService(userId);

    res.status(200).json({
      success: true,
      data: instruments,
    });
  } catch (err) {
    console.log(err);

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getInstrumentSearch = async (req: Request, res: Response) => {
  try {
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

    res.status(200).json({
      success: true,
      data: instruments,
    });
  } catch (err) {
    console.log(err);

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
