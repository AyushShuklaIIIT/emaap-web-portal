import { WorkflowStatus } from "../../../generated/prisma/enums";
import {
  getActiveStateUnitCounts,
  getLiveStateAllocations,
  getRevenueForStatePeriod,
  getStateApplicationsForPendency,
  getStateCertificatesForPeriod,
  getStateVerificationInspectionsForPeriod,
} from "../../../repositories/stateAdminDashboard.repository";
import {
  getFinancialYearRange,
  getMonthRanges,
  round,
  calculateDistanceKm,
} from "../dashboard.service";

const PENDING_STATUSES = new Set<WorkflowStatus>([
  WorkflowStatus.SUBMITTED,
  WorkflowStatus.ALLOCATED,
]);

const getPendencySeverity = (rate: number): "HIGH" | "MEDIUM" | "NORMAL" => {
  if (rate >= 70) return "HIGH";
  if (rate >= 40) return "MEDIUM";
  return "NORMAL";
};

// Types mapped for State level
export interface DistrictPendency {
  district_name: string;
  pending_applications: number;
  total_applications: number;
  pendency_rate: number;
  severity: "HIGH" | "MEDIUM" | "NORMAL";
}

export interface StateAdminDashboardData {
  state_code: string;
  financial_year: string;
  kpis: {
    total_revenue_collected: number;
    government_share: number;
    gatc_share: number;
    revenue_growth_yoy_percent: number | null;
    active_gatcs_lmos: number;
    active_gatcs: number;
    lmos: number;
    state_pendency_rate: number;
    total_instruments_verified: number;
    cryptographically_secured_percentage: number;
    highest_pendency_district: string | null;
  };
  monthly_verification_volume: { month: string; lmo: number; gatc: number }[];
  critical_pendency_by_district: DistrictPendency[];
}

export const getStateAdminDashboardService = async (
  stateCode: string,
  financialYear?: string,
): Promise<StateAdminDashboardData> => {
  const {
    financialYear: resolvedFinancialYear,
    startDate,
    endDate,
  } = getFinancialYearRange(financialYear);
  const startYear = Number(resolvedFinancialYear.slice(0, 4));
  const endYear = startYear + 1;
  const previousStartDate = new Date(Date.UTC(startYear - 1, 3, 1));
  const previousEndDate = new Date(Date.UTC(startYear, 3, 1));

  const [
    revenue,
    previousRevenue,
    units,
    inspections,
    applications,
    certificates,
  ] = await Promise.all([
    getRevenueForStatePeriod(stateCode, startDate, endDate),
    getRevenueForStatePeriod(stateCode, previousStartDate, previousEndDate),
    getActiveStateUnitCounts(stateCode),
    getStateVerificationInspectionsForPeriod(stateCode, startDate, endDate),
    getStateApplicationsForPendency(stateCode, startDate, endDate),
    getStateCertificatesForPeriod(stateCode, startDate, endDate),
  ]);

  const totalRevenue = revenue._sum.total_amount ?? 0;
  const governmentShare = revenue._sum.govt_share ?? 0;
  const gatcShare = revenue._sum.gatc_share ?? 0;
  const previousTotalRevenue = previousRevenue._sum.total_amount ?? 0;
  const revenueGrowth =
    previousTotalRevenue === 0
      ? null
      : round(
          ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100,
        );

  const verifiedInstrumentIds = new Set(
    inspections.map((i) => i.application.instrument_id),
  );
  const totalInstrumentsVerified = verifiedInstrumentIds.size;
  const certifiedInstrumentIds = new Set(
    certificates.map((c) => c.instrument_id),
  );

  let securedCount = 0;
  for (const instrumentId of verifiedInstrumentIds) {
    if (certifiedInstrumentIds.has(instrumentId)) securedCount++;
  }
  const cryptographicallySecuredPercentage =
    totalInstrumentsVerified === 0
      ? 0
      : round((securedCount / totalInstrumentsVerified) * 100);

  const totalApplications = applications.length;
  const pendingApplications = applications.filter((app) =>
    PENDING_STATUSES.has(app.workflow_status),
  ).length;
  const statePendencyRate =
    totalApplications === 0
      ? 0
      : round((pendingApplications / totalApplications) * 100);

  const districtMap = new Map<
    string,
    { district_name: string; total: number; pending: number }
  >();

  for (const application of applications) {
    const districtName =
      application.business.district?.district_name ?? "Unassigned";

    const existing = districtMap.get(districtName);

    if (existing) {
      existing.total++;

      if (PENDING_STATUSES.has(application.workflow_status)) {
        existing.pending++;
      }
    } else {
      districtMap.set(districtName, {
        district_name: districtName,
        total: 1,
        pending: PENDING_STATUSES.has(application.workflow_status) ? 1 : 0,
      });
    }
  }

  const districtPendency: DistrictPendency[] = Array.from(districtMap.values())
    .map((district) => {
      const rate =
        district.total === 0
          ? 0
          : round((district.pending / district.total) * 100);
      return {
        district_name: district.district_name,
        pending_applications: district.pending,
        total_applications: district.total,
        pendency_rate: rate,
        severity: getPendencySeverity(rate),
      };
    })
    .sort((a, b) => b.pendency_rate - a.pendency_rate);

  const highestPendencyDistrict =
    districtPendency.length > 0 ? districtPendency[0].district_name : null;
  const monthRanges = getMonthRanges(startYear, endYear);

  const monthlyVerificationVolume = monthRanges.map((month) => {
    let lmo = 0,
      gatc = 0;
    for (const inspection of inspections) {
      const d = inspection.inspection_date;
      if (d >= month.start && d < month.end) {
        if (inspection.application.assigned_gatc_id) gatc++;
        else if (inspection.application.assigned_officer_id) lmo++;
      }
    }
    return { month: month.month, lmo, gatc };
  });

  return {
    state_code: stateCode,
    financial_year: resolvedFinancialYear,
    kpis: {
      total_revenue_collected: totalRevenue,
      government_share: governmentShare,
      gatc_share: gatcShare,
      revenue_growth_yoy_percent: revenueGrowth,
      active_gatcs_lmos: units.active_gatcs + units.lmos,
      active_gatcs: units.active_gatcs,
      lmos: units.lmos,
      state_pendency_rate: statePendencyRate,
      total_instruments_verified: totalInstrumentsVerified,
      cryptographically_secured_percentage: cryptographicallySecuredPercentage,
      highest_pendency_district: highestPendencyDistrict,
    },
    monthly_verification_volume: monthlyVerificationVolume,
    critical_pendency_by_district: districtPendency,
  };
};

export const getStateAdminAllocationsService = async (stateCode: string) => {
  const allocations = await getLiveStateAllocations(stateCode);
  return allocations.map((allocation) => {
    let assignedType: "LMO" | "GATC" | null = null;
    let assignedTo: string | null = null;

    if (allocation.assigned_gatc) {
      assignedType = "GATC";
      assignedTo = allocation.assigned_gatc.centre_code;
    } else if (allocation.assigned_officer) {
      assignedType = "LMO";
      assignedTo = allocation.assigned_officer.name;
    }

    let distanceKm: number | null = null;
    
    if (allocation.assigned_gatc) {
      distanceKm = calculateDistanceKm(
        allocation.instrument.lat,
        allocation.instrument.long,
        allocation.assigned_gatc.lat,
        allocation.assigned_gatc.long,
      );
      distanceKm = round(distanceKm);
    }
    
    return {
      app_id: allocation.app_id,
      application_no: allocation.application_no,
      instrument: allocation.instrument.category.category_name,
      serial_number: allocation.instrument.serial_number,
      assigned_type: assignedType,
      assigned_to: assignedTo,
      distance_km: distanceKm,
      workflow_status: allocation.workflow_status,
      submission_timestamp: allocation.submission_timestamp.toISOString(),
    };
  });
};

export const exportStateAdminDashboardService = async (
  stateCode: string,
  financialYear?: string,
) => {
  const dashboard = await getStateAdminDashboardService(
    stateCode,
    financialYear,
  );
  const rows: string[] = [];

  const fileName = `${stateCode}-admin-report-${dashboard.financial_year}.csv`;
  return { csv: rows.join("\n"), fileName };
};

import { getStateGatcs } from "../../../repositories/stateAdminDashboard.repository";

export const getStateAdminGatcsService = async (stateCode: string, district?: string) => {
  const gatcs = await getStateGatcs(stateCode, district);
  
  return gatcs.map((gatc) => ({
    gatc_id: gatc.gatc_id,
    centre_code: gatc.centre_code,
    lab_name: gatc.principal_officer.name,
    approval_cert_no: gatc.approval_cert_no,
    ind_mark_code: gatc.ind_mark_code,
    status: gatc.status,
    valid_from: gatc.valid_from,
    valid_to: gatc.valid_to,
    approved_categories: gatc.approved_categories,
    district: gatc.principal_officer.jurisdiction_district?.district_name || "Unassigned",
    principal_officer: gatc.principal_officer,
  }));
};
