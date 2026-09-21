import {
  GatcStatus,
  PaymentStatus,
  TestVerdict,
} from "../../generated/prisma/enums";
import {
  countGatcs,
  countActiveGatcs,
  countPendingRenewals,
  findGatcs,
  findRevenueForGatcs,
  findGatcById,
  updateGatcStatus,
  renewGatcByGatcId,
} from "../../repositories/gatc.repository";
import { GatcListQuery, RenewGatcData } from "../../types";

const getStartOfYear = () => {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
};

const getStartOfNextYear = () => {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
};

const getRenewalLimit = () => {
  const date = new Date();

  date.setDate(date.getDate() + 30);

  return date;
};

const calculateRevenue = (
  receipts: Array<{
    total_amount: number;
    govt_share: number;
    gatc_share: number;
  }>,
) => {
  return receipts.reduce(
    (acc, receipt) => {
      acc.total += receipt.total_amount;
      acc.govt_share += receipt.govt_share;
      acc.gatc_share += receipt.gatc_share;

      return acc;
    },
    {
      total: 0,
      govt_share: 0,
      gatc_share: 0,
    },
  );
};

export const getDashboardService = async () => {
  const now = new Date();

  const [totalGatcs, totalActiveGatcs, pendingLabRenewals] = await Promise.all([
    countGatcs(),
    countActiveGatcs(),
    countPendingRenewals(now, getRenewalLimit()),
  ]);

  const allGatcs = await findGatcs({
    page: 1,
    limit: 10000,
  });

  const gatcIds = allGatcs.data.map((gatc) => gatc.gatc_id);

  const receipts = await findRevenueForGatcs(
    gatcIds,
    getStartOfYear(),
    getStartOfNextYear(),
  );

  const revenue = calculateRevenue(
    receipts.map((receipt) => ({
      total_amount: receipt.total_amount,
      govt_share: receipt.govt_share,
      gatc_share: receipt.gatc_share,
    })),
  );

  return {
    totalActiveGatcs,
    totalGatcs,
    statesCovered: 28,
    unionTerritoriesCovered: 8, // fix by finding states in user
    revenueYtd: revenue,
    pendingLabRenewals,
  };
};

export const getGatcsService = async (query: GatcListQuery) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  const result = await findGatcs({
    search: query.search,
    status: query.status,
    page,
    limit,
  });

  const gatcIds = result.data.map((gatc) => gatc.gatc_id);

  const receipts =
    gatcIds.length > 0
      ? await findRevenueForGatcs(
          gatcIds,
          getStartOfYear(),
          getStartOfNextYear(),
        )
      : [];

  const revenueMap = new Map<
    string,
    {
      total: number;
      govt_share: number;
      gatc_share: number;
    }
  >();

  for (const receipt of receipts) {
    const gatcId = receipt.application.assigned_gatc_id;

    if (!gatcId) continue;

    const current = revenueMap.get(gatcId) ?? {
      total: 0,
      govt_share: 0,
      gatc_share: 0,
    };

    current.total += receipt.total_amount;
    current.govt_share += receipt.govt_share;
    current.gatc_share += receipt.gatc_share;

    revenueMap.set(gatcId, current);
  }

  const data = result.data.map((gatc) => ({
    gatc_id: gatc.gatc_id,

    centre_code: gatc.centre_code,

    lab_name: gatc.principal_officer.name,

    approval_cert_no: gatc.approval_cert_no,

    ind_mark_code: gatc.ind_mark_code,

    status: gatc.status,

    valid_from: gatc.valid_from,

    valid_to: gatc.valid_to,

    approved_categories: gatc.approved_categories,

    principal_officer: gatc.principal_officer,

    revenue: revenueMap.get(gatc.gatc_id) ?? {
      total: 0,
      govt_share: 0,
      gatc_share: 0,
    },
  }));

  return {
    data,

    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

export const getGatcProfileService = async (gatcId: string) => {
  const gatc = await findGatcById(gatcId);

  if (!gatc) {
    throw new Error("GATC not found");
  }

  let totalRevenue = 0;
  let govtShare = 0;
  let gatcShare = 0;

  let successfulPayments = 0;

  let inspections = 0;
  let passedInspections = 0;
  let failedInspections = 0;

  for (const application of gatc.applications) {
    if (application.receipts?.payment_status === PaymentStatus.SUCCESS) {
      successfulPayments++;
      totalRevenue += application.receipts.total_amount;
      govtShare += application.receipts.govt_share;
      gatcShare += application.receipts.gatc_share;
    }

    inspections += application.inspections.length;

    for (const inspection of application.inspections) {
      if (inspection.test_verdict === TestVerdict.PASS) {
        passedInspections++;
      }

      if (inspection.test_verdict === TestVerdict.FAIL) {
        failedInspections++;
      }
    }
  }

  return {
    gatc_id: gatc.gatc_id,
    centre_code: gatc.centre_code,
    approval_cert_no: gatc.approval_cert_no,
    ind_mark_code: gatc.ind_mark_code,
    valid_from: gatc.valid_from,
    valid_to: gatc.valid_to,
    status: gatc.status,
    approved_categories: gatc.approved_categories,
    lat: gatc.lat,
    long: gatc.long,
    principal_officer: gatc.principal_officer,
    applications: gatc.applications.length,
    successfulPayments,
    revenue: {
      total: totalRevenue,
      govt_share: govtShare,
      gatc_share: gatcShare,
    },
    inspections,
    passedInspections,
    failedInspections,
  };
};

export const changeGatcStatusService = async (
  gatcId: string,
  status: GatcStatus,
) => {
  const gatc = await findGatcById(gatcId);

  if (!gatc) {
    throw new Error("GATC not found");
  }

  if (gatc.status === status) {
    return gatc;
  }

  return updateGatcStatus(gatcId, status);
};

export const renewGatcService = async (gatcId: string, data: RenewGatcData) => {
  const gatc = await findGatcById(gatcId);

  if (!gatc) {
    throw new Error("GATC not found");
  }

  if (data.valid_to <= data.valid_from) {
    throw new Error("Renewal expiry must be after start date");
  }

  return renewGatcByGatcId(gatcId, data);
};
