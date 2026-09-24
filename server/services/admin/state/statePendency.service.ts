import { AppError } from "../../../errors/AppError";
import { getPendencyApplicationById } from "../../../repositories/pendencyAdmin.repository";
import {
  getStatePendencyApplications,
  countStatePendencyApplications,
  countStateBreachedApplications,
} from "../../../repositories/pendencyStateAdmin.repository";
import {
  getDaysPending,
  getSlaStatus,
  buildSuggestions,
} from "../pendency.service";

const SLA_DAYS = 15;
const PENDING_STATUSES = new Set(["SUBMITTED", "ALLOCATED"]);

interface StatePendencyQueueInput {
  stateCode: string;
  district?: string;
  slaStatus: "ALL" | "BREACHED" | "WITHIN_SLA";
  page: number;
  limit: number;
}

export const getStatePendencyQueueService = async ({
  stateCode,
  district,
  slaStatus,
  page,
  limit,
}: StatePendencyQueueInput) => {
  const breachedBefore = new Date(Date.now() - SLA_DAYS * 24 * 60 * 60 * 1000);
  const query = {
    stateCode,
    district,
    slaStatus,
    breachedBefore,
    withinSlaFrom: breachedBefore,
    skip: (page - 1) * limit,
    take: limit,
  };

  const [applications, total, breachedCount] = await Promise.all([
    getStatePendencyApplications(query),
    countStatePendencyApplications(query),
    countStateBreachedApplications(stateCode, district, breachedBefore),
  ]);

  const items = [];
  for (const application of applications) {
    const daysPending = getDaysPending(application.submission_timestamp);
    const sla = getSlaStatus(daysPending);
    const suggestions = await buildSuggestions(application as any);

    let currentAssignment = {
      type: null as null | "GATC" | "LMO",
      name: null as string | null,
    };
    if (application.assigned_gatc)
      currentAssignment = {
        type: "GATC",
        name: application.assigned_gatc.centre_code,
      };
    else if (application.assigned_officer)
      currentAssignment = {
        type: "LMO",
        name: application.assigned_officer.name,
      };

    items.push({
      app_id: application.app_id,
      application_no: application.application_no,
      submission_timestamp: application.submission_timestamp.toISOString(),
      days_pending: daysPending,
      business: {
        name: application.business.trade_name,
        location: application.business.geo_address,
        district: application.business.district?.district_name || "Unassigned",
      },
      instrument: {
        category: application.instrument.category.category_name,
        category_code: application.instrument.category.category_code,
        serial_number: application.instrument.serial_number,
        model_no: application.instrument.model_no,
      },
      sla: { status: sla.status, label: sla.label, note: sla.note },
      current_assignment: currentAssignment,
      suggestions,
      action: suggestions.some((s) => s.type === "GATC")
        ? "APPROVE_ROUTE"
        : suggestions.length > 0
          ? "MANUAL_OVERRIDE"
          : "WAIT",
    });
  }

  return {
    items,
    summary: {
      total_pending: total,
      breached_count: breachedCount,
      sla_days: SLA_DAYS,
    },
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
};

export const approveStatePendencyRouteService = async (
  stateCode: string,
  appId: string,
  route: { gatcId?: string; lmoId?: string },
) => {
  const application = await getPendencyApplicationById(appId);

  if (!application) throw new AppError(404, "Application not found");
  if (application.business.state.state_code !== stateCode)
    throw new AppError(
      403,
      "You do not have jurisdiction over this application",
    );

  const { approvePendencyRouteService } = await import("../pendency.service");
  return approvePendencyRouteService(appId, route);
};

export const manualOverrideStatePendencyRouteService = async (
  stateCode: string,
  appId: string,
  assignedType: "LMO" | "GATC",
  assignedId: string,
) => {
  const application = await getPendencyApplicationById(appId);

  if (!application) throw new AppError(404, "Application not found");
  if (application.business.state.state_code !== stateCode)
    throw new AppError(
      403,
      "You do not have jurisdiction over this application",
    );

  const { manualOverridePendencyRouteService } = await import("../pendency.service");
  return manualOverridePendencyRouteService(appId, assignedType, assignedId);
};

export const bulkApproveStatePendencyRoutesService = async (
  stateCode: string,
  appIds: string[],
) => {
  for (const appId of appIds) {
    const app = await getPendencyApplicationById(appId);
    if (app && app.business.state.state_code !== stateCode) {
      throw new AppError(
        403,
        "You do not have jurisdiction over one or more of these applications",
      );
    }
  }

  const { bulkApprovePendencyRoutesService } = await import("../pendency.service");
  return bulkApprovePendencyRoutesService(appIds);
};
