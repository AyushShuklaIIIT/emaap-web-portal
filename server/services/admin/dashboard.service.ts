import { AppError } from "../../errors/AppError";
import { WorkflowStatus } from "../../generated/prisma/enums";
import {
  getRevenueForPeriod,
  getActiveUnitCounts,
  getVerificationInspectionsForPeriod,
  getApplicationsForPendency,
  getCertificatesForPeriod,
  getLiveAllocations,
} from "../../repositories/dashboardAdmin.repository";

interface FinancialYearRange {
  financialYear: string;
  startDate: Date;
  endDate: Date;
}

interface MonthlyVerificationVolume {
  month: string;
  lmo: number;
  gatc: number;
}

interface StatePendency {
  state_code: string;
  state_name: string;
  pending_applications: number;
  total_applications: number;
  pendency_rate: number;
  severity: "HIGH" | "MEDIUM" | "NORMAL";
}

export interface AdminDashboardData {
  financial_year: string;

  kpis: {
    total_revenue_collected: number;
    government_share: number;
    gatc_share: number;
    revenue_growth_yoy_percent: number | null;

    active_gatcs_lmos: number;
    active_gatcs: number;
    lmos: number;

    national_pendency_rate: number;

    total_instruments_verified: number;
    cryptographically_secured_percentage: number;

    highest_pendency_state: string | null;
  };

  monthly_verification_volume: MonthlyVerificationVolume[];

  critical_pendency_by_state: StatePendency[];
}

export interface AdminAllocationData {
  app_id: string;
  application_no: string;

  instrument: string;
  serial_number: string;

  assigned_type: "LMO" | "GATC" | null;
  assigned_to: string | null;

  distance_km: number | null;

  workflow_status: "SUBMITTED" | "ALLOCATED" | "CERTIFIED" | "REJECTED";

  submission_timestamp: string;
}

const PENDING_STATUSES = new Set<WorkflowStatus>([
  WorkflowStatus.SUBMITTED,
  WorkflowStatus.ALLOCATED,
]);

const getCurrentFinancialYear = (): string => {
  const now = new Date();

  const year = now.getUTCFullYear();

  const month = now.getUTCMonth();

  const startYear = month >= 3 ? year : year - 1;

  return `${startYear}-${startYear + 1}`;
};

export const getFinancialYearRange = (
  financialYear?: string,
): FinancialYearRange => {
  const resolvedFinancialYear = financialYear ?? getCurrentFinancialYear();

  const match = /^(\d{4})-(\d{4})$/.exec(resolvedFinancialYear);

  if (!match) {
    throw new AppError(
      400,
      "Invalid financial year. Expected format YYYY-YYYY",
    );
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);

  if (endYear !== startYear + 1) {
    throw new AppError(400, "Invalid financial year range");
  }

  const startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0, 0));

  const endDate = new Date(Date.UTC(endYear, 3, 1, 0, 0, 0, 0));

  return {
    financialYear: resolvedFinancialYear,
    startDate,
    endDate,
  };
};

const getPendencySeverity = (rate: number): "HIGH" | "MEDIUM" | "NORMAL" => {
  /*
   * These are display thresholds because
   * the current schema/page does not define
   * official severity thresholds.
   */
  if (rate >= 70) {
    return "HIGH";
  }

  if (rate >= 40) {
    return "MEDIUM";
  }

  return "NORMAL";
};

export const getMonthRanges = (startYear: number, endYear: number) => {
  const months = [
    { month: "Apr", index: 3 },
    { month: "May", index: 4 },
    { month: "Jun", index: 5 },
    { month: "Jul", index: 6 },
    { month: "Aug", index: 7 },
    { month: "Sep", index: 8 },
    { month: "Oct", index: 9 },
    { month: "Nov", index: 10 },
    { month: "Dec", index: 11 },
    { month: "Jan", index: 0 },
    { month: "Feb", index: 1 },
    { month: "Mar", index: 2 },
  ];

  return months.map((item, position) => {
    const year = position < 9 ? startYear : endYear;

    const nextMonthDate = new Date(Date.UTC(year, item.index + 1, 1));

    return {
      month: item.month,
      start: new Date(Date.UTC(year, item.index, 1)),
      end: nextMonthDate,
    };
  });
};

export const round = (value: number) => Math.round(value * 100) / 100;

export const calculateDistanceKm = (
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

export const getAdminDashboardService = async (
  financialYear?: string,
): Promise<AdminDashboardData> => {
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
    getRevenueForPeriod(startDate, endDate),

    getRevenueForPeriod(previousStartDate, previousEndDate),

    getActiveUnitCounts(),

    getVerificationInspectionsForPeriod(startDate, endDate),

    getApplicationsForPendency(startDate, endDate),

    getCertificatesForPeriod(startDate, endDate),
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
    inspections.map((inspection) => inspection.application.instrument_id),
  );

  const totalInstrumentsVerified = verifiedInstrumentIds.size;
  const certifiedInstrumentIds = new Set(
    certificates.map((certificate) => certificate.instrument_id),
  );

  let securedCount = 0;

  for (const instrumentId of verifiedInstrumentIds) {
    if (certifiedInstrumentIds.has(instrumentId)) {
      securedCount++;
    }
  }

  const cryptographicallySecuredPercentage =
    totalInstrumentsVerified === 0
      ? 0
      : round((securedCount / totalInstrumentsVerified) * 100);

  const totalApplications = applications.length;

  const pendingApplications = applications.filter((application) =>
    PENDING_STATUSES.has(application.workflow_status),
  ).length;

  const nationalPendencyRate =
    totalApplications === 0
      ? 0
      : round((pendingApplications / totalApplications) * 100);

  const stateMap = new Map<
    string,
    {
      state_code: string;
      state_name: string;
      total: number;
      pending: number;
    }
  >();

  for (const application of applications) {
    const state = application.business.state;
    const existing = stateMap.get(state.state_code);

    if (existing) {
      existing.total++;

      if (PENDING_STATUSES.has(application.workflow_status)) {
        existing.pending++;
      }
    } else {
      stateMap.set(state.state_code, {
        state_code: state.state_code,
        state_name: state.state_name,
        total: 1,
        pending: PENDING_STATUSES.has(application.workflow_status) ? 1 : 0,
      });
    }
  }

  const statePendency: StatePendency[] = Array.from(stateMap.values())
    .map((state) => {
      const rate =
        state.total === 0 ? 0 : round((state.pending / state.total) * 100);

      return {
        state_code: state.state_code,
        state_name: state.state_name,
        pending_applications: state.pending,
        total_applications: state.total,
        pendency_rate: rate,
        severity: getPendencySeverity(rate),
      };
    })
    .sort((a, b) => b.pendency_rate - a.pendency_rate);

  const highestPendencyState =
    statePendency.length > 0 ? statePendency[0].state_name : null;
  const monthRanges = getMonthRanges(startYear, endYear);

  const monthlyVerificationVolume = monthRanges.map((month) => {
    let lmo = 0;
    let gatc = 0;

    for (const inspection of inspections) {
      const inspectionDate = inspection.inspection_date;

      if (inspectionDate >= month.start && inspectionDate < month.end) {
        if (inspection.application.assigned_gatc_id) {
          gatc++;
        } else if (inspection.application.assigned_officer_id) {
          lmo++;
        }
      }
    }

    return {
      month: month.month,
      lmo,
      gatc,
    };
  });

  return {
    financial_year: resolvedFinancialYear,

    kpis: {
      total_revenue_collected: totalRevenue,
      government_share: governmentShare,
      gatc_share: gatcShare,
      revenue_growth_yoy_percent: revenueGrowth,
      active_gatcs_lmos: units.active_gatcs + units.lmos,
      active_gatcs: units.active_gatcs,
      lmos: units.lmos,
      national_pendency_rate: nationalPendencyRate,
      total_instruments_verified: totalInstrumentsVerified,
      cryptographically_secured_percentage: cryptographicallySecuredPercentage,
      highest_pendency_state: highestPendencyState,
    },

    monthly_verification_volume: monthlyVerificationVolume,
    critical_pendency_by_state: statePendency,
  };
};

export const getAdminAllocationsService = async (): Promise<
  AdminAllocationData[]
> => {
  const allocations = await getLiveAllocations();
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

export const exportAdminDashboardService = async (financialYear?: string) => {
  const dashboard = await getAdminDashboardService(financialYear);
  const rows: string[] = [];
  const csvEscape = (value: string | number | null) => {
    if (value === null) {
      return "";
    }

    const stringValue = String(value);

    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  rows.push(["eMaap Admin Dashboard Report"].map(csvEscape).join(","));
  rows.push(
    ["Financial Year", dashboard.financial_year].map(csvEscape).join(","),
  );
  rows.push("");
  rows.push(["KPI", "Value"].map(csvEscape).join(","));

  rows.push(
    ["Total Revenue Collected", dashboard.kpis.total_revenue_collected]
      .map(csvEscape)
      .join(","),
  );

  rows.push(
    ["Government Share", dashboard.kpis.government_share]
      .map(csvEscape)
      .join(","),
  );

  rows.push(["GATC Share", dashboard.kpis.gatc_share].map(csvEscape).join(","));
  rows.push(
    ["Revenue Growth YoY %", dashboard.kpis.revenue_growth_yoy_percent]
      .map(csvEscape)
      .join(","),
  );
  rows.push(
    ["Active GATCs & LMOs", dashboard.kpis.active_gatcs_lmos]
      .map(csvEscape)
      .join(","),
  );
  rows.push(
    ["Active GATCs", dashboard.kpis.active_gatcs].map(csvEscape).join(","),
  );
  rows.push(["LMOs", dashboard.kpis.lmos].map(csvEscape).join(","));
  rows.push(
    ["National Pendency %", dashboard.kpis.national_pendency_rate]
      .map(csvEscape)
      .join(","),
  );
  rows.push(
    ["Total Instruments Verified", dashboard.kpis.total_instruments_verified]
      .map(csvEscape)
      .join(","),
  );
  rows.push(
    [
      "Cryptographically Secured %",
      dashboard.kpis.cryptographically_secured_percentage,
    ]
      .map(csvEscape)
      .join(","),
  );
  rows.push("");
  rows.push(["Month", "LMO", "GATC"].map(csvEscape).join(","));

  for (const month of dashboard.monthly_verification_volume) {
    rows.push([month.month, month.lmo, month.gatc].map(csvEscape).join(","));
  }

  rows.push("");
  rows.push(
    [
      "State",
      "Pending Applications",
      "Total Applications",
      "Pendency Rate %",
      "Severity",
    ]
      .map(csvEscape)
      .join(","),
  );

  for (const state of dashboard.critical_pendency_by_state) {
    rows.push(
      [
        state.state_name,
        state.pending_applications,
        state.total_applications,
        state.pendency_rate,
        state.severity,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const fileName = `admin-report-${dashboard.financial_year}.csv`;
  return {
    csv: rows.join("\n"),
    fileName,
  };
};
