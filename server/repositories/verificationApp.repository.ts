import { VerificationAppData, VerificationForm } from "../types";
import { prisma } from "../lib/prisma";
import { randomUUID } from "node:crypto";

import {
  WorkflowStatus,
  AccuracyClass,
  InstrumentStatus,
  PaymentMethod,
  AppType,
} from "../generated/prisma/enums";

export const getAllVerificationsByBusinessId = async (
  businessId: string,
): Promise<VerificationAppData[]> => {
  const applications = await prisma.verificationApp.findMany({
    where: { business_id: businessId },
    include: {
      receipts: true,
      inspections: true,
      instrument: true,
      business: true,
      assigned_officer: true,
      assigned_gatc: true,
    },
  });

  return applications;
};

export const postVerificationAppByBusinessId = async (
  businessId: string,
  instrumentId: string,
  data: VerificationForm,
): Promise<VerificationAppData> => {
  const application = await prisma.verificationApp.create({
    data: {
      application_no: data.applicationId,
      app_type: "RE_VERIFICATION",
      workflow_status: "SUBMITTED",
      instrument_id: instrumentId,
      business_id: businessId,
    },
    include: {
      receipts: true,
      inspections: true,
      instrument: true,
      business: true,
      assigned_officer: true,
      assigned_gatc: true,
    },
  });

  return application;
};

export const findActiveVerificationAppByInstrumentId = async (
  businessId: string,
  instrumentId: string,
): Promise<VerificationAppData | null> => {
  const application = await prisma.verificationApp.findFirst({
    where: {
      business_id: businessId,
      instrument_id: instrumentId,
      workflow_status: {
        in: ["SUBMITTED", "ALLOCATED"],
      },
    },
    include: {
      receipts: true,
      inspections: true,
      instrument: true,
      business: true,
      assigned_officer: true,
      assigned_gatc: true,
    },
  });

  return application;
};

export const findUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: {
      user_id: userId,
    },
  });
};

export const findBusinessByUserId = async (userId: string) => {
  return prisma.businessProfile.findUnique({
    where: {
      user_id: userId,
    },
    include: {
      state: true,
    },
  });
};

export const findCategoryByCode = async (categoryCode: string) => {
  return prisma.instrumentCategory.findUnique({
    where: {
      category_code: categoryCode,
    },
  });
};

export const findStateByCode = async (stateCode: string) => {
  return prisma.state.findUnique({
    where: {
      state_code: stateCode,
    },
  });
};

export const findInstrumentBySerialNumber = async (
  serialNumber: string,
  businessId: string,
) => {
  return prisma.measuringInstrument.findFirst({
    where: {
      serial_number: serialNumber,
      business_id: businessId,
    },
    orderBy: {
      instrument_id: "asc",
    },
  });
};

export const findActiveApplicationByInstrumentId = async (
  instrumentId: string,
) => {
  return prisma.verificationApp.findFirst({
    where: {
      instrument_id: instrumentId,
      workflow_status: {
        in: [WorkflowStatus.SUBMITTED, WorkflowStatus.ALLOCATED],
      },
    },
    orderBy: {
      submission_timestamp: "desc",
    },
  });
};

export const findFeeRules = async (stateId: string, categoryId: string) => {
  return prisma.feeRule.findMany({
    where: {
      state_id: stateId,
      category_id: categoryId,
    },
    orderBy: [
      {
        min_value: "desc",
      },
      {
        fee_amount: "asc",
      },
    ],
  });
};

export const getVerificationMetadata = async () => {
  const [categories, states] = await Promise.all([
    prisma.instrumentCategory.findMany({
      orderBy: {
        category_name: "asc",
      },
      select: {
        category_id: true,
        category_code: true,
        category_name: true,
        accuracy_class: true,
        oiml_standard_ref: true,
        verification_cycle_months: true,
      },
    }),

    prisma.state.findMany({
      orderBy: {
        state_name: "asc",
      },
      select: {
        state_id: true,
        state_code: true,
        state_name: true,
      },
    }),
  ]);

  return {
    categories,
    states,
  };
};

export const getVerificationCategoriesByStateCode = async (
  stateCode: string,
) => {
  const rules = await prisma.feeRule.findMany({
    where: { state: { state_code: stateCode } },
    distinct: ["category_id"],
    orderBy: { category: { category_name: "asc" } },
    select: {
      category: {
        select: {
          category_id: true,
          category_code: true,
          category_name: true,
          accuracy_class: true,
          oiml_standard_ref: true,
          verification_cycle_months: true,
        },
      },
    },
  });

  return rules.map((rule) => rule.category);
};

export const getVerificationConditionsByStateAndCategory = async (
  stateCode: string,
  categoryCode: string,
) => {
  const rules = await prisma.feeRule.findMany({
    where: {
      state: { state_code: stateCode },
      category: { category_code: categoryCode },
      condition: { not: null },
    },
    select: { condition: true },
    orderBy: { fee_rule_id: "asc" },
  });

  return [
    ...new Set(
      rules
        .map((rule) => rule.condition?.trim())
        .filter(
          (condition): condition is string =>
            Boolean(condition) &&
            !/^MPE\b/i.test(condition) &&
            !/\b(metric|error)\b/i.test(condition),
        ),
    ),
  ];
};

export const createApplicationTransaction = async (params: {
  existingInstrumentId?: string;

  instrument: {
    instrument_id: string;
    serial_number: string;
    model_no: string;
    manufacturer_name: string;
    accuracy_class: AccuracyClass;
    metric: string;
    error?: number;
    address: string;
    district: string;
    pincode: number;
    state: string;
    lat: number;
    long: number;
    capacity_value?: number | null;
    capacity_unit?: string | null;
    business_id: string;
    category_id: string;
    status: InstrumentStatus;
  };

  application: {
    app_id: string;
    application_no: string;
    app_type: AppType;
    instrument_id: string;
    business_id: string;
    workflow_status: WorkflowStatus;
  };

  receipt: {
    receipt_id: string;
    receipt_no: string;
    transaction_id: string;
    transaction_date: Date;
    payment_method: PaymentMethod;
    statutory_fee: number;
    carriage_charges: number;
    adjusting_charges: number;
    total_amount: number;
    govt_share: number;
    gatc_share: number;
    payment_status: "SUCCESS";
    app_id: string;
  };
}) => {
  return prisma.$transaction(async (tx) => {
    let instrument;

    if (params.existingInstrumentId) {
      instrument = await tx.measuringInstrument.update({
        where: {
          instrument_id: params.existingInstrumentId,
        },
        data: {
          serial_number: params.instrument.serial_number,
          model_no: params.instrument.model_no,
          manufacturer_name: params.instrument.manufacturer_name,
          accuracy_class: params.instrument.accuracy_class,
          metric: params.instrument.metric,
          address: params.instrument.address,
          district: params.instrument.district,
          pincode: params.instrument.pincode,
          state: params.instrument.state,
          lat: params.instrument.lat,
          long: params.instrument.long,
          capacity_value: params.instrument.capacity_value,
          capacity_unit: params.instrument.capacity_unit,
          category_id: params.instrument.category_id,
          status: InstrumentStatus.PENDING,
          error: params.instrument.error,
        },
      });
    } else {
      instrument = await tx.measuringInstrument.create({
        data: {
          instrument_id: params.instrument.instrument_id,
          serial_number: params.instrument.serial_number,
          model_no: params.instrument.model_no,
          manufacturer_name: params.instrument.manufacturer_name,
          accuracy_class: params.instrument.accuracy_class,
          metric: params.instrument.metric,
          address: params.instrument.address,
          district: params.instrument.district,
          pincode: params.instrument.pincode,
          state: params.instrument.state,
          lat: params.instrument.lat,
          long: params.instrument.long,
          capacity_value: params.instrument.capacity_value,
          capacity_unit: params.instrument.capacity_unit,
          business_id: params.instrument.business_id,
          category_id: params.instrument.category_id,
          status: InstrumentStatus.PENDING,
          error: params.instrument.error,
        },
      });
    }

    const application = await tx.verificationApp.create({
      data: {
        app_id: params.application.app_id,
        application_no: params.application.application_no,
        app_type: params.application.app_type,
        instrument_id: instrument.instrument_id,
        business_id: params.application.business_id,
        workflow_status: WorkflowStatus.SUBMITTED,
      },
    });

    const receipt = await tx.paymentReceipt.create({
      data: {
        receipt_id: params.receipt.receipt_id,
        receipt_no: params.receipt.receipt_no,
        transaction_id: params.receipt.transaction_id,
        transaction_date: params.receipt.transaction_date,
        payment_method: params.receipt.payment_method,
        due_date: null,
        statutory_fee: params.receipt.statutory_fee,
        carriage_charges: params.receipt.carriage_charges,
        adjusting_charges: params.receipt.adjusting_charges,
        total_amount: params.receipt.total_amount,
        govt_share: params.receipt.govt_share,
        gatc_share: params.receipt.gatc_share,
        payment_status: params.receipt.payment_status,
        app_id: application.app_id,
      },
    });

    return {
      instrument,
      application,
      receipt,
    };
  });
};

export const generateInstrumentId = (): string => randomUUID();

export const generateApplicationId = (): string => randomUUID();

export const generateReceiptId = (): string => randomUUID();

export const generateApplicationNumber = (): string => {
  const year = new Date().getFullYear();

  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `EMAAP/${year}/${suffix}`;
};

export const generateReceiptNumber = (): string => {
  const year = new Date().getFullYear();

  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `RCPT/${year}/${suffix}`;
};

export const generateTransactionId = (): string => {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

  return `DEMO-${suffix}`;
};
