import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockDb = {
  users: new Map<string, any>(),
  registrationApplications: new Map<string, any>(),
  gatcCentres: new Map<string, any>(),
};

vi.mock("../server/lib/prisma", () => {
  const prismaMock = {
    $transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
      return callback(prismaMock);
    }),

    state: {
      findFirst: vi.fn(async ({ where }: any) => {
        const clauses = where?.OR ?? [];

        const matchesDelhi = clauses.some(
          (clause: any) =>
            clause.state_code === "DL" || clause.state_name === "Delhi",
        );

        if (!matchesDelhi) {
          return null;
        }

        return {
          state_id: "state-delhi",
          state_code: "DL",
          state_name: "Delhi",
        };
      }),
    },

    registrationApplication: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        const application = mockDb.registrationApplications.get(where.id);

        if (!application) {
          return null;
        }

        if (include?.user) {
          return {
            ...application,
            user: mockDb.users.get(application.userId),
          };
        }

        return application;
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const application = mockDb.registrationApplications.get(where.id);

        if (!application) {
          return null;
        }

        const updated = {
          ...application,
          ...data,
        };

        mockDb.registrationApplications.set(where.id, updated);

        return updated;
      }),
    },

    gatcCentre: {
      create: vi.fn(async ({ data }: any) => {
        const gatcId = `gatc-${mockDb.gatcCentres.size + 1}`;

        const gatc = {
          gatc_id: gatcId,
          ...data,
        };

        mockDb.gatcCentres.set(gatcId, gatc);

        return gatc;
      }),

      findMany: vi.fn(async ({ where, include }: any) => {
        return Array.from(mockDb.gatcCentres.values())
          .filter((centre: any) => {
            const principalOfficer = mockDb.users.get(
              centre.principal_officer_id,
            );

            if (
              where?.principal_officer?.jurisdiction_state &&
              principalOfficer?.jurisdiction_state !==
                where.principal_officer.jurisdiction_state
            ) {
              return false;
            }

            const requestedDistrict =
              where?.principal_officer?.jurisdiction_district?.district_name;

            if (
              requestedDistrict &&
              principalOfficer?.jurisdiction_district?.district_name !==
                requestedDistrict
            ) {
              return false;
            }

            return true;
          })
          .map((centre: any) => {
            if (include?.principal_officer) {
              const principalOfficer = mockDb.users.get(
                centre.principal_officer_id,
              );

              return {
                ...centre,
                principal_officer: principalOfficer,
              };
            }

            return centre;
          });
      }),

      count: vi.fn(async ({ where }: any) => {
        return Array.from(mockDb.gatcCentres.values()).filter((centre: any) => {
          const principalOfficer = mockDb.users.get(
            centre.principal_officer_id,
          );

          if (where?.status && centre.status !== where.status) {
            return false;
          }

          if (
            where?.principal_officer?.jurisdiction_state &&
            principalOfficer?.jurisdiction_state !==
              where.principal_officer.jurisdiction_state
          ) {
            return false;
          }

          return true;
        }).length;
      }),
    },

    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        return mockDb.users.get(where.user_id) ?? null;
      }),

      update: vi.fn(async ({ where, data }: any) => {
        const user = mockDb.users.get(where.user_id);

        if (!user) {
          return null;
        }

        const updatedUser = {
          ...user,
          ...data,
        };

        mockDb.users.set(where.user_id, updatedUser);

        return updatedUser;
      }),

      count: vi.fn(async ({ where }: any) => {
        return Array.from(mockDb.users.values()).filter((user: any) => {
          if (
            where?.registrationRole &&
            user.registrationRole !== where.registrationRole
          ) {
            return false;
          }

          if (
            where?.jurisdiction_state &&
            user.jurisdiction_state !== where.jurisdiction_state
          ) {
            return false;
          }

          return true;
        }).length;
      }),
    },
  };

  return {
    prisma: prismaMock,
  };
});

vi.mock("../server/middleware/require-admin", () => ({
  requireAdmin: (_req: any, res: any, next: any) => {
    res.locals.adminUserId = "admin-user-001";
    next();
  },
}));

vi.mock("../server/middleware/require-auth", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = {
      user_id: "state-admin-dl",
    };

    next();
  },
}));

import { createServer } from "../server/app";
import {
  getStateGatcs,
  getActiveStateUnitCounts,
} from "../server/repositories/stateAdminDashboard.repository";

describe("GATC Approval -> State Admin Overview", () => {
  const stateAdminUserId = "state-admin-dl";
  const gatcUserId = "gatc-user-001";
  const applicationId = "11111111-1111-4111-8111-111111111111";

  beforeEach(() => {
    mockDb.users.clear();
    mockDb.registrationApplications.clear();
    mockDb.gatcCentres.clear();
    vi.clearAllMocks();

    mockDb.users.set(stateAdminUserId, {
      user_id: stateAdminUserId,
      email: "stateadmin@delhi.gov.in",
      fullName: "Delhi State Admin",
      name: "Delhi State Admin",
      jurisdiction_state: "DL",
      registrationRole: "ADMIN",
      isActive: true,
    });

    mockDb.users.set(gatcUserId, {
      user_id: gatcUserId,
      email: "gatc.principal@delhimetrology.com",
      fullName: "Delhi Calibration Centre",
      name: "Delhi Calibration Centre",

      jurisdiction_state: "Delhi",

      jurisdiction_district_id: "district-delhi-central",
      jurisdiction_district: {
        district_id: "district-delhi-central",
        district_name: "Central Delhi",
      },

      registrationRole: "GATC_PRINCIPAL",
      isActive: false,
    });

    mockDb.registrationApplications.set(applicationId, {
      id: applicationId,
      userId: gatcUserId,
      role: "GATC_PRINCIPAL",
      status: "UNDER_REVIEW",
      lat: 28.6139,
      long: 77.209,
    });
  });

  it("normalizes GATC state jurisdiction on approval and makes the GATC visible to the correct State Admin", async () => {
    const { app } = createServer();
    const initialGatcs = await getStateGatcs("DL");
    expect(initialGatcs).toHaveLength(0);
    const initialCounts = await getActiveStateUnitCounts("DL");
    expect(initialCounts.active_gatcs).toBe(0);

    const approvePayload = {
      centre_code: "GATC-DL-001",
      approval_cert_no: "CERT-GOI-DL-001",
      ind_mark_code: "IND-DL-001",
      valid_from: "2026-01-01T00:00:00.000Z",
      valid_to: "2027-01-01T00:00:00.000Z",
      approved_categories: ["WEIGHING_SCALE", "FLOW_METER"],
    };

    const approvalResponse = await request(app)
      .post(`/api/v1/admin/registrations/${applicationId}/approve`)
      .send(approvePayload);

    expect(approvalResponse.status).toBe(200);
    expect(approvalResponse.body.success).toBe(true);
    expect(approvalResponse.body.application.status).toBe("APPROVED");

    const updatedUser = mockDb.users.get(gatcUserId);

    expect(updatedUser).toBeDefined();
    expect(updatedUser.isActive).toBe(true);

    // "Delhi" -> "DL"
    expect(updatedUser.jurisdiction_state).toBe("DL");

    expect(mockDb.gatcCentres.size).toBe(1);

    const createdGatc = Array.from(mockDb.gatcCentres.values())[0];

    expect(createdGatc.centre_code).toBe("GATC-DL-001");
    expect(createdGatc.approval_cert_no).toBe("CERT-GOI-DL-001");
    expect(createdGatc.ind_mark_code).toBe("IND-DL-001");
    expect(createdGatc.status).toBe("ACTIVE");
    expect(createdGatc.principal_officer_id).toBe(gatcUserId);

    expect(createdGatc.approved_categories).toEqual([
      "WEIGHING_SCALE",
      "FLOW_METER",
    ]);

    const stateGatcs = await getStateGatcs("DL");

    expect(stateGatcs).toHaveLength(1);

    expect(stateGatcs[0].centre_code).toBe("GATC-DL-001");
    expect(stateGatcs[0].status).toBe("ACTIVE");

    expect(stateGatcs[0].principal_officer?.email).toBe(
      "gatc.principal@delhimetrology.com",
    );

    const stateUnitCounts = await getActiveStateUnitCounts("DL");

    expect(stateUnitCounts.active_gatcs).toBe(1);

    const stateAdminGatcsResponse = await request(app).get(
      "/api/state-admin/gatcs",
    );

    expect(stateAdminGatcsResponse.status).toBe(200);
    expect(stateAdminGatcsResponse.body.success).toBe(true);

    expect(stateAdminGatcsResponse.body.data).toHaveLength(1);

    expect(stateAdminGatcsResponse.body.data[0].centre_code).toBe(
      "GATC-DL-001",
    );

    expect(stateAdminGatcsResponse.body.data[0].status).toBe("ACTIVE");

    expect(stateAdminGatcsResponse.body.data[0].principal_officer.email).toBe(
      "gatc.principal@delhimetrology.com",
    );
  });
});
