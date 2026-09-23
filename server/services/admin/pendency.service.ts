import { AppError } from "../../errors/AppError";
import { AccuracyClass } from "../../generated/prisma/enums";
import {
  getEligibleGatcs,
  getPendencyApplicationById,
  getPendencyApplications,
  countPendencyApplications,
  countBreachedApplications,
  assignApplication,
  getActiveGatcById,
  getLmoById,
  getEligibleLmos,
} from "../../repositories/pendencyAdmin.repository";

const SLA_DAYS = 15;

const PENDING_STATUSES = new Set(["SUBMITTED", "ALLOCATED"]);

interface PendencyQueueInput {
  stateCode?: string;
  slaStatus: "ALL" | "BREACHED" | "WITHIN_SLA";
  page: number;
  limit: number;
}

interface GatcRouteSuggestion {
  type: "GATC";
  gatc_id: string;
  centre_code: string;
  distance_km: number;
}

interface LmoRouteSuggestion {
  type: "LMO";
  lmo_id: string;
  employee_id: string;
  name: string;
  jurisdiction_district: string;
}

type RouteSuggestion = GatcRouteSuggestion | LmoRouteSuggestion;

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

  suggestions: RouteSuggestion[];

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

const findNearestGatcs = async (
  categoryCode: string,
  categoryName: string,
  stateCode: string,
  district: string,
  instrumentLat: number,
  instrumentLong: number,
) => {
  const gatcs = await getEligibleGatcs(
    categoryCode,
    stateCode,
    district,
    categoryName,
  );

  if (gatcs.length === 0) {
    return [];
  }

  return gatcs
    .map((gatc) => {
      const distance = calculateDistanceKm(
        instrumentLat,
        instrumentLong,
        gatc.lat,
        gatc.long,
      );

      return {
        type: "GATC" as const,
        gatc_id: gatc.gatc_id,
        centre_code: gatc.centre_code,
        distance_km: round(distance),
      };
    })
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 5);
};

type PendencyApplicationLocation = {
  instrument: {
    accuracy_class: AccuracyClass;
    district: string;
    category: {
      category_code: string;
      category_name: string;
    };
    lat: number;
    long: number;
  };
  business: {
    state: {
      state_code: string;
    };
    user: {
      jurisdiction_district: string;
    };
  };
};

const buildSuggestions = async (application: PendencyApplicationLocation) => {
  const instrument = application.instrument;
  const businessState = application.business.state;

  const suggestions: RouteSuggestion[] = [];

  if (
    instrument.accuracy_class === "CLASS_III" ||
    instrument.accuracy_class === "CLASS_IIII"
  ) {
    const nearestGatcs = await findNearestGatcs(
      instrument.category.category_code,
      instrument.category.category_name,
      businessState.state_code,
      instrument.district,
      instrument.lat,
      instrument.long,
    );

    suggestions.push(...nearestGatcs);
  }

  const lmos = await getEligibleLmos(
    businessState.state_code,
    instrument.district,
  );

  suggestions.push(
    ...lmos.map((lmo) => ({
      type: "LMO" as const,
      lmo_id: lmo.user_id,
      employee_id: lmo.employee_id,
      name: lmo.user.name,
      jurisdiction_district: lmo.user.jurisdiction_district,
    })),
  );

  return suggestions;
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
    const suggestions = await buildSuggestions(application);
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

    const action: "APPROVE_ROUTE" | "MANUAL_OVERRIDE" | "WAIT" =
      suggestions.some((suggestion) => suggestion.type === "GATC")
        ? "APPROVE_ROUTE"
        : suggestions.length > 0
          ? "MANUAL_OVERRIDE"
          : "WAIT";
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

      suggestions,

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

export const approvePendencyRouteService = async (
  appId: string,
  route: { gatcId?: string; lmoId?: string },
) => {
  const application = await getPendencyApplicationById(appId);

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  if (!PENDING_STATUSES.has(application.workflow_status)) {
    throw new AppError(400, "Only pending applications can be routed");
  }

  if ((route.gatcId && route.lmoId) || (!route.gatcId && !route.lmoId)) {
    throw new AppError(400, "Provide exactly one of gatcId or lmoId");
  }

  if (route.gatcId) {
    if (
      application.instrument.accuracy_class !== "CLASS_III" &&
      application.instrument.accuracy_class !== "CLASS_IIII"
    ) {
      throw new AppError(
        400,
        "GATCs are not permitted to verify Class I and II instruments.",
      );
    }

    const gatc = await getActiveGatcById(route.gatcId);

    if (!gatc) {
      throw new AppError(404, "Active GATC not found");
    }

    const eligibleGatcs = await getEligibleGatcs(
      application.instrument.category.category_code,
      application.business.state.state_code,
      application.instrument.district,
      application.instrument.category.category_name,
    );

    if (!eligibleGatcs.some((item) => item.gatc_id === route.gatcId)) {
      throw new AppError(
        400,
        "Selected GATC is not eligible for this application",
      );
    }

    const updated = await assignApplication(appId, "GATC", route.gatcId);

    return {
      app_id: updated.app_id,
      application_no: updated.application_no,
      workflow_status: updated.workflow_status,
      assigned_type: "GATC" as const,
      assigned_id: route.gatcId,
      assigned_to: updated.assigned_gatc?.centre_code ?? null,
      business_name: application.business.trade_name,
      instrument_category: application.instrument.category.category_name,
      serial_no: application.instrument.serial_number,
      model_no: application.instrument.model_no,
      previousCertificateUrl: application.previous_certificate_url,
      manufacturerCertificateUrl: application.manufacturer_certificate_url,
      error: application.instrument.error,
    };
  }

  const lmo = await getLmoById(route.lmoId!);

  if (!lmo) {
    throw new AppError(404, "Active LMO not found");
  }

  if (
    lmo.user.jurisdiction_state !== application.business.state.state_code ||
    lmo.user.jurisdiction_district !== application.instrument.district
  ) {
    throw new AppError(
      400,
      "Selected LMO is not eligible for this application jurisdiction",
    );
  }

  const updated = await assignApplication(appId, "LMO", route.lmoId!);

  return {
    app_id: updated.app_id,
    application_no: updated.application_no,
    workflow_status: updated.workflow_status,
    assigned_type: "LMO" as const,
    assigned_id: route.lmoId,
    assigned_to: updated.assigned_officer?.name ?? null,
    business_name: application.business.trade_name,
    instrument_category: application.instrument.category.category_name,
    serial_no: application.instrument.serial_number,
    model_no: application.instrument.model_no,
    error: application.instrument.error,
    previousCertificateUrl: application.previous_certificate_url,
    manufacturerCertificateUrl: application.manufacturer_certificate_url,
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
    if (
      application.instrument.accuracy_class !== "CLASS_III" &&
      application.instrument.accuracy_class !== "CLASS_IIII"
    ) {
      throw new AppError(
        400,
        "GATCs are not permitted to verify Class I and II instruments.",
      );
    }

    const gatc = await getActiveGatcById(assignedId);

    if (!gatc) {
      throw new AppError(404, "Active GATC not found");
    }

    const categoryCode = application.instrument.category.category_code;
    const eligibleGatcs = await getEligibleGatcs(
      categoryCode,
      application.business.state.state_code,
      application.instrument.district,
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
    assigned_id: assignedId,
    business_name: application.business.trade_name,
    instrument_category: application.instrument.category.category_name,
    assigned_to:
      assignedType === "GATC"
        ? (updated.assigned_gatc?.centre_code ?? null)
        : (updated.assigned_officer?.name ?? null),

    serial_no: application.instrument.serial_number,
    model_no: application.instrument.model_no,
    previousCertificateUrl: application.previous_certificate_url,
    manufacturerCertificateUrl: application.manufacturer_certificate_url,
    error: application.instrument.error,
  };
};

export const bulkApprovePendencyRoutesService = async (appIds: string[]) => {
  const results: Array<{
    app_id: string;
    application_no: string;
    assigned_to: string | null;
    assigned_type?: "LMO" | "GATC";
    assigned_id?: string;
    business_name?: string;
    instrument_category?: string;
    success: boolean;
    message?: string;
    serial_no?: string;
    model_no?: string;
    previousCertificateUrl?: string | null;
    manufacturerCertificateUrl?: string | null;
    error?: number | null;
  }> = [];

  for (const appId of appIds) {
    try {
      const application = await getPendencyApplicationById(appId);

      if (!application) {
        throw new AppError(404, "Application not found");
      }

      const suggestions = await buildSuggestions(application);
      const suggestion = suggestions[0];

      if (!suggestion) {
        throw new AppError(400, "No eligible route is available");
      }

      const result = await approvePendencyRouteService(
        appId,
        suggestion.type === "GATC"
          ? { gatcId: suggestion.gatc_id }
          : { lmoId: suggestion.lmo_id },
      );

      results.push({
        app_id: result.app_id,
        application_no: result.application_no,
        assigned_to: result.assigned_to,
        assigned_type: result.assigned_type,
        assigned_id: result.assigned_id,
        business_name: result.business_name,
        instrument_category: result.instrument_category,
        success: true,
        serial_no: result.serial_no,
        model_no: result.model_no,
        previousCertificateUrl: result.previousCertificateUrl,
        manufacturerCertificateUrl: result.manufacturerCertificateUrl,
        error: result.error,
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
