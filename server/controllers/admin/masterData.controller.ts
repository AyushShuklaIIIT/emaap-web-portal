import type { Request, Response } from "express";

import {
  createFeeScheduleService,
  createInstrumentCategoryService,
  getFeeSchedulesService,
  getInstrumentCategoriesService,
  getInstrumentCategoryOptionsService,
  getStatesService,
  updateFeeScheduleService,
  updateInstrumentCategoryService,
} from "../../services/admin/masterData.service";

const ACCURACY_CLASSES = [
  "CLASS_I",
  "CLASS_II",
  "CLASS_III",
  "CLASS_IIII",
  "CLASS_M1",
  "CLASS_XIII",
  "CLASS_0_5",
] as const;

const FEE_BASES = ["PER_PIECE", "PER_METRE", "PER_LITRE", "FIXED"] as const;

const isValidDecimal = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return false;
  }

  const stringValue = String(value);

  if (!/^\d+(\.\d+)?$/.test(stringValue)) {
    return false;
  }

  return Number.isFinite(Number(stringValue));
};

const normalizeNullableDecimal = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value).trim();
};

const validateFeeSchedulePayload = (body: any) => {
  const errors: string[] = [];

  if (typeof body.state_id !== "string" || !body.state_id.trim()) {
    errors.push("state_id is required");
  }

  if (typeof body.category_id !== "string" || !body.category_id.trim()) {
    errors.push("category_id is required");
  }

  if (typeof body.unit !== "string" || !body.unit.trim()) {
    errors.push("unit is required");
  }

  if (typeof body.fee_amount !== "string" || !body.fee_amount.trim()) {
    errors.push("fee_amount is required");
  }

  if (!isValidDecimal(body.min_value)) {
    errors.push("min_value must be a valid decimal");
  }

  if (!isValidDecimal(body.max_value)) {
    errors.push("max_value must be a valid decimal");
  }

  if (!isValidDecimal(body.fee_amount)) {
    errors.push("fee_amount must be a valid decimal");
  }

  if (!isValidDecimal(body.additional_fee)) {
    errors.push("additional_fee must be a valid decimal");
  }

  if (!isValidDecimal(body.additional_unit)) {
    errors.push("additional_unit must be a valid decimal");
  }

  if (!isValidDecimal(body.maximum_fee)) {
    errors.push("maximum_fee must be a valid decimal");
  }

  if (!FEE_BASES.includes(body.fee_basis)) {
    errors.push("fee_basis is invalid");
  }

  if (
    body.min_value !== null &&
    body.min_value !== undefined &&
    body.min_value !== "" &&
    body.max_value !== null &&
    body.max_value !== undefined &&
    body.max_value !== ""
  ) {
    const min = Number(body.min_value);

    const max = Number(body.max_value);

    if (min > max) {
      errors.push("min_value cannot be greater than max_value");
    }
  }

  return errors;
};

const buildPayload = (body: any) => ({
  state_id: String(body.state_id).trim(),

  category_id: String(body.category_id).trim(),

  min_value: normalizeNullableDecimal(body.min_value),

  max_value: normalizeNullableDecimal(body.max_value),

  unit: String(body.unit).trim(),

  fee_amount: String(body.fee_amount).trim(),

  fee_basis: body.fee_basis,

  condition: body.condition ? String(body.condition).trim() : null,

  additional_fee: normalizeNullableDecimal(body.additional_fee),

  additional_unit: normalizeNullableDecimal(body.additional_unit),

  maximum_fee: normalizeNullableDecimal(body.maximum_fee),
});

const validateInstrumentCategoryPayload = (body: any) => {
  const errors: string[] = [];

  if (typeof body.category_code !== "string" || !body.category_code.trim()) {
    errors.push("category_code is required");
  }

  if (typeof body.category_name !== "string" || !body.category_name.trim()) {
    errors.push("category_name is required");
  }

  if (!ACCURACY_CLASSES.includes(body.accuracy_class)) {
    errors.push("accuracy_class is invalid");
  }

  if (
    typeof body.oiml_standard_ref !== "string" ||
    !body.oiml_standard_ref.trim()
  ) {
    errors.push("oiml_standard_ref is required");
  }

  if (
    !Number.isInteger(body.verification_cycle_months) ||
    body.verification_cycle_months <= 0
  ) {
    errors.push("verification_cycle_months must be a positive integer");
  }

  return errors;
};

const buildInstrumentCategoryPayload = (body: any) => ({
  category_code: body.category_code.trim(),
  category_name: body.category_name.trim(),
  accuracy_class: body.accuracy_class,
  oiml_standard_ref: body.oiml_standard_ref.trim(),
  verification_cycle_months: body.verification_cycle_months,
});

export const getFeeSchedules = async (req: Request, res: Response) => {
  try {
    const pageParam = Number.parseInt(String(req.query.page ?? "1"), 10);

    const limitParam = Number.parseInt(String(req.query.limit ?? "10"), 10);

    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;

    const result = await getFeeSchedulesService(page, limit, search);

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Failed to fetch fee schedules:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee schedules",
    });
  }
};

export const getInstrumentCategories = async (req: Request, res: Response) => {
  try {
    const pageParam = Number.parseInt(String(req.query.page ?? "1"), 10);

    const limitParam = Number.parseInt(String(req.query.limit ?? "10"), 10);

    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const filter = req.query.filter === "GATC" ? "GATC" : "ALL";

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;

    const result = await getInstrumentCategoriesService(
      page,
      limit,
      search,
      filter,
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Failed to fetch instrument categories:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch instrument categories",
    });
  }
};

export const getInstrumentCategoryOptions = async (
  _req: Request,
  res: Response,
) => {
  try {
    const data = await getInstrumentCategoryOptionsService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to fetch instrument category options:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch instrument category options",
    });
  }
};

export const createInstrumentCategory = async (req: Request, res: Response) => {
  try {
    const errors = validateInstrumentCategoryPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid instrument category data",
        errors,
      });
    }

    const data = await createInstrumentCategoryService(
      buildInstrumentCategoryPayload(req.body),
    );

    return res.status(201).json({
      success: true,
      message: "Instrument category created successfully",
      data,
    });
  } catch (error: any) {
    console.error("Failed to create instrument category:", error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Category code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create instrument category",
    });
  }
};

export const updateInstrumentCategory = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id).trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Instrument category id is required",
      });
    }

    const errors = validateInstrumentCategoryPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid instrument category data",
        errors,
      });
    }

    const data = await updateInstrumentCategoryService(
      id,
      buildInstrumentCategoryPayload(req.body),
    );

    return res.status(200).json({
      success: true,
      message: "Instrument category updated successfully",
      data,
    });
  } catch (error: any) {
    console.error("Failed to update instrument category:", error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Category code already exists",
      });
    }

    if (error?.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Instrument category not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update instrument category",
    });
  }
};

export const getStates = async (_req: Request, res: Response) => {
  try {
    const data = await getStatesService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to fetch states:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch states",
    });
  }
};

export const createFeeSchedule = async (req: Request, res: Response) => {
  try {
    const errors = validateFeeSchedulePayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee schedule data",
        errors,
      });
    }

    const data = await createFeeScheduleService(buildPayload(req.body));

    return res.status(201).json({
      success: true,
      message: "Fee schedule created successfully",
      data,
    });
  } catch (error: any) {
    console.error("Failed to create fee schedule:", error);

    if (error?.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid state or instrument category",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create fee schedule",
    });
  }
};

export const updateFeeSchedule = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id).trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Fee rule id is required",
      });
    }

    const errors = validateFeeSchedulePayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee schedule data",
        errors,
      });
    }

    const data = await updateFeeScheduleService(id, buildPayload(req.body));

    return res.status(200).json({
      success: true,
      message: "Fee schedule updated successfully",
      data,
    });
  } catch (error: any) {
    console.error("Failed to update fee schedule:", error);

    if (error?.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid state or instrument category",
      });
    }

    if (error?.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Fee schedule not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update fee schedule",
    });
  }
};
