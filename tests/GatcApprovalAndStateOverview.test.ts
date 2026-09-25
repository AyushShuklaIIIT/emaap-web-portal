import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// In-memory mock database state for zero DB alteration
const mockDb = {
  users: new Map<string, any>(),
  registrationApplications: new Map<string, any>(),
  gatcCentres: new Map<string, any>(),
};

vi.mock('../server/lib/prisma', () => {
  const prismaMock = {
    $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
      return cb(prismaMock);
    }),
    registrationApplication: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        const app = mockDb.registrationApplications.get(where.id);
        if (!app) return null;
        if (include?.user) {
          return { ...app, user: mockDb.users.get(app.userId) };
        }
        return app;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const app = mockDb.registrationApplications.get(where.id);
        if (!app) return null;
        const updated = { ...app, ...data };
        mockDb.registrationApplications.set(where.id, updated);
        return updated;
      }),
    },
    gatcCentre: {
      create: vi.fn(async ({ data }: any) => {
        const gatcId = `gatc-${Date.now()}`;
        const newGatc = { gatc_id: gatcId, ...data };
        mockDb.gatcCentres.set(gatcId, newGatc);
        return newGatc;
      }),
      findMany: vi.fn(async ({ where, include }: any) => {
        const centres = Array.from(mockDb.gatcCentres.values());
        return centres
          .filter((centre) => {
            const officer = mockDb.users.get(centre.principal_officer_id);
            if (
              where?.principal_officer?.jurisdiction_state &&
              officer?.jurisdiction_state !==
                where.principal_officer.jurisdiction_state
            ) {
              return false;
            }
            return true;
          })
          .map((centre) => {
            if (include?.principal_officer) {
              return {
                ...centre,
                principal_officer: mockDb.users.get(
                  centre.principal_officer_id,
                ),
              };
            }
            return centre;
          });
      }),
      count: vi.fn(async ({ where }: any) => {
        const centres = Array.from(mockDb.gatcCentres.values());
        return centres.filter((centre) => {
          const officer = mockDb.users.get(centre.principal_officer_id);
          if (where?.status && centre.status !== where.status) {
            return false;
          }
          if (
            where?.principal_officer?.jurisdiction_state &&
            officer?.jurisdiction_state !==
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
        return mockDb.users.get(where.user_id) || null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const user = mockDb.users.get(where.user_id);
        if (!user) return null;
        const updated = { ...user, ...data };
        mockDb.users.set(where.user_id, updated);
        return updated;
      }),
      count: vi.fn(async ({ where }: any) => {
        return Array.from(mockDb.users.values()).filter((u) => {
          if (
            where?.registrationRole &&
            u.registrationRole !== where.registrationRole
          )
            return false;
          if (
            where?.jurisdiction_state &&
            u.jurisdiction_state !== where.jurisdiction_state
          )
            return false;
          return true;
        }).length;
      }),
    },
  };

  return { prisma: prismaMock };
});

vi.mock('../server/middleware/require-admin', () => ({
  requireAdmin: (req: any, res: any, next: any) => {
    res.locals.adminUserId = 'admin-user-001';
    next();
  },
}));

vi.mock('../server/middleware/require-auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { user_id: 'state-admin-dl' };
    next();
  },
}));

import { createServer } from '../server/app';
import { getStateGatcs, getActiveStateUnitCounts } from '../server/repositories/stateAdminDashboard.repository';

describe('GATC Admin Approval & State Admin Overview Integration', () => {
  const stateAdminUserId = 'state-admin-dl';
  const gatcUserId = 'gatc-user-001';
  const applicationId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    mockDb.users.clear();
    mockDb.registrationApplications.clear();
    mockDb.gatcCentres.clear();
    vi.clearAllMocks();

    // 1. Setup State Admin user for Delhi (DL)
    mockDb.users.set(stateAdminUserId, {
      user_id: stateAdminUserId,
      email: 'stateadmin@delhi.gov.in',
      fullName: 'Delhi State Admin',
      jurisdiction_state: 'DL',
      registrationRole: 'STATE_ADMIN',
      isActive: true,
    });

    // 2. Setup GATC Applicant User for Delhi (DL)
    mockDb.users.set(gatcUserId, {
      user_id: gatcUserId,
      email: 'gatc.principal@delhimetrology.com',
      fullName: 'Delhi Calibration Centre',
      name: 'Delhi Calibration Centre',
      jurisdiction_state: 'DL',
      registrationRole: 'GATC_PRINCIPAL',
      isActive: false,
    });

    // 3. Setup Pending Registration Application for GATC
    mockDb.registrationApplications.set(applicationId, {
      id: applicationId,
      userId: gatcUserId,
      role: 'GATC_PRINCIPAL',
      status: 'PENDING',
      lat: 28.6139,
      long: 77.209,
    });
  });

  it('approving a GATC registration creates the GATC centre profile and makes it visible in State Admin overview', async () => {
    const { app } = createServer();

    // Step 1: Verify State Admin initially has 0 GATCs in State Overview
    const initialGatcs = await getStateGatcs('DL');
    expect(initialGatcs.length).toBe(0);

    const initialCounts = await getActiveStateUnitCounts('DL');
    expect(initialCounts.active_gatcs).toBe(0);

    // Step 2: Admin approves the GATC registration application
    const approvePayload = {
      centre_code: 'GATC-DL-001',
      approval_cert_no: 'CERT-GOI-DL-001',
      ind_mark_code: 'IND-DL-001',
      valid_from: new Date('2026-01-01').toISOString(),
      valid_to: new Date('2027-01-01').toISOString(),
      approved_categories: ['WEIGHING_SCALE', 'FLOW_METER'],
    };

    const approvalResponse = await request(app)
      .post(`/api/v1/admin/registrations/${applicationId}/approve`)
      .send(approvePayload);

    expect(approvalResponse.status).toBe(200);
    expect(approvalResponse.body.success).toBe(true);
    expect(approvalResponse.body.application.status).toBe('APPROVED');

    // Step 3: Verify GATC Profile was created and User activated
    const updatedUser = mockDb.users.get(gatcUserId);
    expect(updatedUser.isActive).toBe(true);

    expect(mockDb.gatcCentres.size).toBe(1);
    const createdGatc = Array.from(mockDb.gatcCentres.values())[0];
    expect(createdGatc.centre_code).toBe('GATC-DL-001');
    expect(createdGatc.approval_cert_no).toBe('CERT-GOI-DL-001');
    expect(createdGatc.status).toBe('ACTIVE');
    expect(createdGatc.principal_officer_id).toBe(gatcUserId);

    // Step 4: Verify GATC Profile now shows up in the State Admin overview
    const stateGatcs = await getStateGatcs('DL');
    expect(stateGatcs.length).toBe(1);
    expect(stateGatcs[0].centre_code).toBe('GATC-DL-001');
    expect(stateGatcs[0].status).toBe('ACTIVE');
    expect(stateGatcs[0].principal_officer?.email).toBe(
      'gatc.principal@delhimetrology.com',
    );

    // Step 5: Verify Active GATC Unit KPI counts increment in State Overview
    const stateUnitCounts = await getActiveStateUnitCounts('DL');
    expect(stateUnitCounts.active_gatcs).toBe(1);

    // Step 6: Verify API endpoint for State Admin GATCs list returns the approved GATC
    const stateAdminGatcsResponse = await request(app)
      .get('/api/state-admin/gatcs')
      .send();

    expect(stateAdminGatcsResponse.status).toBe(200);
    expect(stateAdminGatcsResponse.body.success).toBe(true);
    expect(stateAdminGatcsResponse.body.data.length).toBe(1);
    expect(stateAdminGatcsResponse.body.data[0].centre_code).toBe('GATC-DL-001');
  });
});
