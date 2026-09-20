import { AppError } from "../../errors/AppError";
import {
  getEligibleGatcs,
  getAllEligibleGatcs,
  getPendencyApplicationById,
  getPendencyApplications,
  countPendencyApplications,
  countBreachedApplications,
  assignApplication,
  getActiveGatcById,
  getLmoById,
} from "../../repositories/pendencyAdmin.repository";

const SLA_DAYS = 15;

const PENDING_STATUSES = new Set(["SUBMITTED", "ALLOCATED"]);

interface PendencyQueueInput {
  stateCode?: string;
  slaStatus: "ALL" | "BREACHED" | "WITHIN_SLA";
  page: number;
  limit: number;
}

interface AdminPendencyItem {
  app_id: string;
  application_no: string;
  submission_timestamp: string;
  days_pending: number;
  business: {
    name: string;
    location: string;
    state_code: string;
  };
  instrument: {
    category: string;
    category_code: string;
    serial_number: string;
    model_no: string;
  };
  sla: {
    status: "BREACHED" | "WITHIN_SLA";
    label: string;
    days_pending: number;
    note: string | null;
  };
  current_assignment: {
    type: "LMO" | "GATC" | null;
    name: string | null;
  };
  suggestion: {
    type: "GATC" | "LMO" | "CALCULATING" | "NONE";
    target_id: string | null;
    target_name: string | null;
    distance_km: number | null;
    message: string;
  };
  action: "APPROVE_ROUTE" | "MANUAL_OVERRIDE" | "WAIT";
}

const getDaysPending = (submissionTimestamp: Date): number => {
  const now = new Date();
  const diffMs = now.getTime() - submissionTimestamp.getTime();

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const getSlaStatus = (daysPending: number) => {
  const breached = daysPending > SLA_DAYS;

  return {
    status: breached ? ("BREACHED" as const) : ("WITHIN_SLA" as const),
    label: breached
      ? `${daysPending} Days Pending`
      : `${daysPending} Days Pending`,
    note: breached ? "SLA Breached" : null,
  };
};

const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const round = (value: number) => Math.round(value * 100) / 100;

const findNearestGatc = async (
  categoryCode: string,
  categoryName: string,
  stateCode: string,
  instrumentLat: number,
  instrumentLong: number,
) => {
  let gatcs = await getEligibleGatcs(categoryCode, stateCode, categoryName);

  if (gatcs.length === 0) {
    gatcs = await getAllEligibleGatcs(categoryCode, categoryName);
  }

  if (gatcs.length === 0) {
    return null;
  }

  let nearest = gatcs[0];

  let nearestDistance = calculateDistanceKm(
    instrumentLat,
    instrumentLong,
    nearest.lat,
    nearest.long,
  );

  for (let index = 1; index < gatcs.length; index++) {
    const gatc = gatcs[index];

    const distance = calculateDistanceKm(
      instrumentLat,
      instrumentLong,
      gatc.lat,
      gatc.long,
    );

    if (distance < nearestDistance) {
      nearest = gatc;
      nearestDistance = distance;
    }
  }

  return {
    gatc_id: nearest.gatc_id,
    centre_code: nearest.centre_code,
    distance_km: round(nearestDistance),
  };
};

const buildSuggestion = async (
  application: NonNullable<
    Awaited<ReturnType<typeof getPendencyApplicationById>>
  >,
) => {
  const instrument = application.instrument;
  const businessState = application.business.state;
  const nearestGatc = await findNearestGatc(
    instrument.category.category_code,
    instrument.category.category_name,
    businessState.state_code,
    instrument.lat,
    instrument.long,
  );

  if (!nearestGatc) {
    return {
      type: "CALCULATING" as const,
      target_id: null,
      target_name: null,
      distance_km: null,
      message:
        "No eligible active GATC is currently available for this instrument category.",
    };
  }

  return {
    type: "GATC" as const,
    target_id: nearestGatc.gatc_id,
    target_name: nearestGatc.centre_code,
    distance_km: nearestGatc.distance_km,
    message: `Re-routing to ${nearestGatc.centre_code}. Distance: ${nearestGatc.distance_km} km.`,
  };
};

export const getPendencyQueueService = async ({
  stateCode,
  slaStatus,
  page,
  limit,
}: PendencyQueueInput) => {
  const now = new Date();

  const breachedBefore = new Date(
    now.getTime() - SLA_DAYS * 24 * 60 * 60 * 1000,
  );

  const query = {
    stateCode,
    slaStatus,
    breachedBefore,
    withinSlaFrom: breachedBefore,
    skip: (page - 1) * limit,
    take: limit,
  };

  const [applications, total, breachedCount] = await Promise.all([
    getPendencyApplications(query),
    countPendencyApplications(query),
    countBreachedApplications(stateCode, breachedBefore),
  ]);

  const items: AdminPendencyItem[] = [];

  for (const application of applications) {
    const daysPending = getDaysPending(application.submission_timestamp);
    const sla = getSlaStatus(daysPending);
    const suggestion = await buildSuggestion(application);
    let currentAssignment: AdminPendencyItem["current_assignment"] = {
      type: null,
      name: null,
    };

    if (application.assigned_gatc) {
      currentAssignment = {
        type: "GATC",
        name: application.assigned_gatc.centre_code,
      };
    } else if (application.assigned_officer) {
      currentAssignment = {
        type: "LMO",
        name: application.assigned_officer.name,
      };
    }

    let action: "APPROVE_ROUTE" | "MANUAL_OVERRIDE" | "WAIT";

    if (suggestion.type === "GATC") {
      action = "APPROVE_ROUTE";
    } else {
      action = "WAIT";
    }

    items.push({
      app_id: application.app_id,
      application_no: application.application_no,
      submission_timestamp: application.submission_timestamp.toISOString(),
      days_pending: daysPending,
      business: {
        name: application.business.trade_name,
        location: application.business.geo_address,
        state_code: application.business.state.state_code,
      },
      instrument: {
        category: application.instrument.category.category_name,
        category_code: application.instrument.category.category_code,
        serial_number: application.instrument.serial_number,
        model_no: application.instrument.model_no,
      },
      sla: {
        status: sla.status,
        label: sla.label,
        days_pending: daysPending,
        note: sla.note,
      },
      current_assignment: currentAssignment,
      suggestion,
      action,
    });
  }

  return {
    items,
    summary: {
      total_pending: total,
      breached_count: breachedCount,
      sla_days: SLA_DAYS,
    },
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
    filters: {
      state_code: stateCode ?? "ALL",
      sla_status: slaStatus,
    },
  };
};

export const approvePendencyRouteService = async (appId: string) => {
  const application = await getPendencyApplicationById(appId);

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  if (!PENDING_STATUSES.has(application.workflow_status)) {
    throw new AppError(400, "Only pending applications can be routed");
  }

  const suggestion = await buildSuggestion(application);

  if (suggestion.type !== "GATC" || !suggestion.target_id) {
    throw new AppError(400, "No eligible GATC route is available");
  }

  const updated = await assignApplication(appId, "GATC", suggestion.target_id);

  return {
    app_id: updated.app_id,
    application_no: updated.application_no,
    workflow_status: updated.workflow_status,
    assigned_type: "GATC",
    assigned_to: updated.assigned_gatc?.centre_code ?? null,
  };
};

export const manualOverridePendencyRouteService = async (
  appId: string,

  assignedType: "LMO" | "GATC",

  assignedId: string,
) => {
  const application = await getPendencyApplicationById(appId);

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  if (!PENDING_STATUSES.has(application.workflow_status)) {
    throw new AppError(400, "Only pending applications can be reassigned");
  }

  if (assignedType === "GATC") {
    const gatc = await getActiveGatcById(assignedId);

    if (!gatc) {
      throw new AppError(404, "Active GATC not found");
    }

    const categoryCode = application.instrument.category.category_code;
    const eligibleGatcs = await getAllEligibleGatcs(
      categoryCode,
      application.instrument.category.category_name,
    );

    const isEligible = eligibleGatcs.some(
      (item) => item.gatc_id === assignedId,
    );

    if (!isEligible) {
      throw new AppError(
        400,
        "Selected GATC is not approved for this instrument category or state",
      );
    }
  }

  if (assignedType === "LMO") {
    const lmo = await getLmoById(assignedId);

    if (!lmo) {
      throw new AppError(404, "LMO not found");
    }
  }

  const updated = await assignApplication(appId, assignedType, assignedId);

  return {
    app_id: updated.app_id,
    application_no: updated.application_no,
    workflow_status: updated.workflow_status,
    assigned_type: assignedType,
    assigned_to:
      assignedType === "GATC"
        ? (updated.assigned_gatc?.centre_code ?? null)
        : (updated.assigned_officer?.name ?? null),
  };
};

export const bulkApprovePendencyRoutesService = async (appIds: string[]) => {
  const results: Array<{
    app_id: string;
    application_no: string;
    assigned_to: string | null;
    success: boolean;
    message?: string;
  }> = [];

  for (const appId of appIds) {
    try {
      const result = await approvePendencyRouteService(appId);

      results.push({
        app_id: result.app_id,
        application_no: result.application_no,
        assigned_to: result.assigned_to,
        success: true,
      });
    } catch (error) {
      results.push({
        app_id: appId,
        application_no: "Unknown",
        assigned_to: null,
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to approve route",
      });
    }
  }

  return {
    total: appIds.length,
    successful: results.filter((item) => item.success).length,
    failed: results.filter((item) => !item.success).length,
    results,
  };
};
