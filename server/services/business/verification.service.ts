import { AppError } from "../../errors/AppError";
import { AccuracyClass, PaymentMethod } from "../../generated/prisma/enums";
import {
  findUserByUserId,
  findBusinessByUserId,
} from "../../repositories/dashboard.repository";
import { findVerifiedInstrumentForBusiness } from "../../repositories/instrument.repository";
import {
  getAllVerificationsByBusinessId,
  findActiveVerificationAppByInstrumentId,
  postVerificationAppByBusinessId,
  findFeeRules,
  findUserById,
  findCategoryByCode,
  findStateByCode,
  getVerificationMetadata,
  createApplicationTransaction,
  findActiveApplicationByInstrumentId,
  findInstrumentBySerialNumber,
  generateApplicationId,
  generateApplicationNumber,
  generateInstrumentId,
  generateReceiptId,
  generateReceiptNumber,
  generateTransactionId,
} from "../../repositories/verificationApp.repository";
import {
  CreateVerificationApplicationInput,
  CreateVerificationApplicationResponse,
  VerificationAppData,
  VerificationFeeQuoteInput,
  VerificationFeeQuoteResponse,
  VerificationForm,
  VerificationMetadataResponse,
} from "../../types";

export const getVerificationAppService = async (
  userId: string,
): Promise<VerificationAppData[]> => {
  const user = await findUserByUserId(userId);
  if (!user) throw new AppError(404, "User not found");

  const business = await findBusinessByUserId(userId);
  if (!business) return [];

  const applications = await getAllVerificationsByBusinessId(
    business.business_id,
  );

  return applications;
};

export const postVerificationAppService = async (
  userId: string,
  data: VerificationForm,
): Promise<VerificationAppData> => {
  const user = await findUserByUserId(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const business = await findBusinessByUserId(userId);

  if (!business) {
    throw new AppError(404, "Business not found");
  }

  const instrument = await findVerifiedInstrumentForBusiness(
    business.business_id,
    data.instrumentSerialNumber,
    data.instrumentSubCategory,
  );

  if (!instrument) {
    throw new AppError(404, "Verified instrument not found for this business");
  }

  const existingApplication = await findActiveVerificationAppByInstrumentId(
    business.business_id,
    instrument.instrument_id,
  );

  if (existingApplication) {
    throw new AppError(
      409,
      "A verification application already exists for this instrument",
    );
  }

  const application = await postVerificationAppByBusinessId(
    business.business_id,
    instrument.instrument_id,
    data,
  );

  return application;
};

const parseMetricValue = (metric: string): number | undefined => {
  if (!metric?.trim()) {
    return undefined;
  }

  const match = metric.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return undefined;
  }

  const value = Number(match[0]);

  return Number.isFinite(value) ? value : undefined;
};

const parseCapacity = (
  metric: string,
): {
  value: number | null;
  unit: string | null;
} => {
  const value = parseMetricValue(metric);

  if (value === undefined) {
    return {
      value: null,
      unit: null,
    };
  }

  const match = metric.trim().match(/-?\d+(?:\.\d+)?\s*(.*)$/i);

  const unit = match?.[1]?.trim() || null;

  return {
    value,
    unit,
  };
};

const normalizeAccuracyClass = (
  accuracyClass: AccuracyClass,
): AccuracyClass => {
  return accuracyClass;
};

const validateCoordinates = (lat: number, long: number) => {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (!Number.isFinite(long) || long < -180 || long > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }
};

const validatePincode = (pincode: number) => {
  if (!Number.isInteger(pincode) || pincode < 100000 || pincode > 999999) {
    throw new Error("Pincode must be a valid 6-digit number");
  }
};

const validatePaymentMethod = (paymentMethod: PaymentMethod) => {
  if (!["UPI", "NET_BANKING", "NEFT_RTGS"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }
};

const calculateFeeFromRules = (
  rules: Awaited<ReturnType<typeof findFeeRules>>,
  metric: string,
): VerificationFeeQuoteResponse => {
  if (rules.length === 0) {
    throw new Error(
      "No fee rule is configured for the selected state and instrument category",
    );
  }

  const metricValue = parseMetricValue(metric);

  const applicableRules = rules.filter((rule) => {
    const min = rule.min_value === null ? null : Number(rule.min_value);

    const max = rule.max_value === null ? null : Number(rule.max_value);

    if (min === null && max === null) {
      return true;
    }

    if (metricValue === undefined) {
      return false;
    }

    if (min !== null && metricValue < min) {
      return false;
    }

    if (max !== null && metricValue > max) {
      return false;
    }

    return true;
  });

  if (applicableRules.length === 0) {
    throw new Error("No fee rule matches the supplied metric/capacity");
  }

  const rule = applicableRules[0];

  const statutoryFee = Number(rule.fee_amount);

  const additionalFee = Number(rule.additional_fee ?? 0);

  const calculatedTotal = statutoryFee + additionalFee;

  const maximumFee =
    rule.maximum_fee === null ? null : Number(rule.maximum_fee);

  const totalAmount =
    maximumFee !== null
      ? Math.min(calculatedTotal, maximumFee)
      : calculatedTotal;

  return {
    statutoryFee,
    additionalFee,
    totalAmount,
    feeBasis: String(rule.fee_basis),
    condition: rule.condition ?? null,
    maximumFee,
  };
};

const validateApplicationContext = async (
  userId: string,
  categoryCode: string,
  stateCode: string,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const business = await findBusinessByUserId(userId);

  if (!business) {
    throw new Error("Business profile not found for this user");
  }

  const category = await findCategoryByCode(categoryCode);

  if (!category) {
    throw new Error(`Instrument category '${categoryCode}' does not exist`);
  }

  const state = await findStateByCode(stateCode);

  if (!state) {
    throw new Error(`State '${stateCode}' does not exist`);
  }

  if (business.state_code !== state.state_id) {
    throw new Error(
      "The selected state must match the business registered state",
    );
  }

  return {
    user,
    business,
    category,
    state,
  };
};

export const getVerificationMetadataService =
  async (): Promise<VerificationMetadataResponse> => {
    return getVerificationMetadata();
  };

export const getVerificationFeeQuoteService = async (
  input: VerificationFeeQuoteInput,
): Promise<VerificationFeeQuoteResponse> => {
  const { category, state } = await validateApplicationContext(
    input.user_id,
    input.category_code,
    input.state_code,
  );

  const rules = await findFeeRules(state.state_id, category.category_id);

  return calculateFeeFromRules(rules, input.metric);
};

export const createVerificationApplicationService = async (
  input: CreateVerificationApplicationInput,
): Promise<CreateVerificationApplicationResponse> => {
  if (!input.model_no?.trim()) {
    throw new Error("Model number is required");
  }

  if (!input.manufacturer_name?.trim()) {
    throw new Error("Manufacturer name is required");
  }

  if (!input.instrument_serial_number?.trim()) {
    throw new Error("Instrument serial number is required");
  }

  if (!input.metric?.trim()) {
    throw new Error("Maximum capacity / flow rate is required");
  }

  if (!input.address?.trim()) {
    throw new Error("Installation address is required");
  }

  validatePincode(input.pincode);
  validateCoordinates(input.lat, input.long);
  validatePaymentMethod(input.payment_method);

  if (input.app_type !== "INITIAL" && input.app_type !== "RE_VERIFICATION") {
    throw new Error("Invalid application type");
  }

  const { business, category, state } = await validateApplicationContext(
    input.user_id,
    input.category_code,
    input.state_code,
  );

  const rules = await findFeeRules(state.state_id, category.category_id);

  const fee = calculateFeeFromRules(rules, input.metric);

  const existingInstrument = await findInstrumentBySerialNumber(
    input.instrument_serial_number.trim(),
    business.business_id,
  );

  let instrumentId: string;
  let shouldCreateInstrument = false;

  if (!existingInstrument) {
    if (input.app_type === "RE_VERIFICATION") {
      throw new Error("Re-verification requires an existing instrument");
    }

    instrumentId = generateInstrumentId();

    shouldCreateInstrument = true;
  } else {
    instrumentId = existingInstrument.instrument_id;

    const activeApplication = await findActiveApplicationByInstrumentId(
      existingInstrument.instrument_id,
    );

    if (activeApplication) {
      throw new Error(
        `A verification application already exists for this instrument. Application No: ${activeApplication.application_no}`,
      );
    }

    if (input.app_type === "INITIAL") {
      if (existingInstrument.status === "VERIFIED") {
        throw new Error(
          "This instrument is already verified. Please use Re-verification.",
        );
      }

      if (existingInstrument.status === "EXPIRED") {
        throw new Error(
          "This instrument has expired. Please use Re-verification.",
        );
      }

      if (existingInstrument.status === "PENDING") {
        throw new Error("This instrument is already under verification.");
      }

      if (existingInstrument.category_id !== category.category_id) {
        throw new Error(
          "The existing instrument belongs to a different instrument category.",
        );
      }
    }

    if (input.app_type === "RE_VERIFICATION") {
      if (
        existingInstrument.status !== "VERIFIED" &&
        existingInstrument.status !== "EXPIRED"
      ) {
        throw new Error(
          "Re-verification is only available for verified or expired instruments.",
        );
      }

      if (existingInstrument.category_id !== category.category_id) {
        throw new Error(
          "The selected category does not match the existing instrument.",
        );
      }
    }
  }

  const { value: capacityValue, unit: capacityUnit } = parseCapacity(
    input.metric,
  );

  const applicationId = generateApplicationId();
  const applicationNo = generateApplicationNumber();
  const receiptId = generateReceiptId();
  const receiptNo = generateReceiptNumber();
  const transactionId = generateTransactionId();

  const result = await createApplicationTransaction({
    existingInstrumentId: shouldCreateInstrument ? undefined : instrumentId,

    instrument: {
      instrument_id: instrumentId,
      serial_number: input.instrument_serial_number.trim(),
      model_no: input.model_no.trim(),
      manufacturer_name: input.manufacturer_name.trim(),
      accuracy_class: normalizeAccuracyClass(category.accuracy_class),
      metric: input.metric.trim(),
      address: input.address.trim(),
      pincode: input.pincode,
      state: state.state_code,
      lat: input.lat,
      long: input.long,
      capacity_value: capacityValue,
      capacity_unit: capacityUnit,
      business_id: business.business_id,
      category_id: category.category_id,
      status: "PENDING",
    },

    application: {
      app_id: applicationId,
      application_no: applicationNo,
      app_type: input.app_type,
      instrument_id: instrumentId,
      business_id: business.business_id,
      workflow_status: "SUBMITTED",
    },

    receipt: {
      receipt_id: receiptId,
      receipt_no: receiptNo,
      transaction_id: transactionId,
      transaction_date: new Date(),
      payment_method: input.payment_method,
      statutory_fee: fee.statutoryFee,
      carriage_charges: 0,
      adjusting_charges: 0,
      total_amount: fee.totalAmount,

      /*
       * Your schema does not define a
       * govt/GATC revenue-split rule.
       *
       * For the current demo payment,
       * the entire collected amount is
       * recorded as govt_share.
       *
       * Replace this when the actual
       * accounting rule is defined.
       */
      govt_share: fee.totalAmount,
      gatc_share: 0,
      payment_status: "SUCCESS",
      app_id: applicationId,
    },
  });

  return {
    applicationId: result.application.app_id,
    applicationNo: result.application.application_no,
    instrumentId: result.instrument.instrument_id,
    workflowStatus: result.application.workflow_status,
    applicationType: result.application.app_type,

    payment: {
      receiptId: result.receipt.receipt_id,
      receiptNo: result.receipt.receipt_no,
      transactionId: result.receipt.transaction_id,
      paymentMethod: result.receipt.payment_method,
      paymentStatus: result.receipt.payment_status,
      totalAmount: result.receipt.total_amount,
    },

    category: {
      categoryId: category.category_id,
      categoryCode: category.category_code,
      categoryName: category.category_name,
      accuracyClass: category.accuracy_class,
    },

    state: {
      stateId: state.state_id,
      stateCode: state.state_code,
      stateName: state.state_name,
    },

    fee,
  };
};
