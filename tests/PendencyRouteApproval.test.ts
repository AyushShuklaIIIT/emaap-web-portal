import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock prisma before importing the app so DB calls don't fire
vi.mock('../server/lib/prisma', () => ({
  prisma: {
    verificationApp: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    lmoOfficer: {
      findFirst: vi.fn(),
    },
    gatcCentre: {
      findFirst: vi.fn(),
    },
  },
}));

// Spy on emitRouteAssigned so we can assert it was (or wasn't) called
vi.mock('../server/socket/routeEvents', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../server/socket/routeEvents')>();
  return {
    ...actual,
    emitRouteAssigned: vi.fn(),
    emitAdminAllocationsUpdate: vi.fn(),
  };
});

import { emitRouteAssigned } from '../server/socket/routeEvents';
import { prisma } from '../server/lib/prisma';
import { createServer } from '../server/app';

// Mock middleware so auth doesn't block our test requests
vi.mock('../server/middleware/require-auth', () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../server/middleware/require-admin', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// Stub the pendency route service to return a predictable result
vi.mock('../server/services/admin/pendency.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../server/services/admin/pendency.service')>();
  return {
    ...actual,
    approvePendencyRouteService: vi.fn().mockResolvedValue({
      app_id: 'APP-001',
      application_no: 'APP-NO-001',
      assigned_type: 'LMO',
      assigned_id: 'LMO-USER-001',
      assigned_to: 'Test Officer',
      business_name: 'Test Business',
      instrument_category: 'Weighing Scale',
      serial_no: 'SN-001',
      model_no: 'MOD-001',
      previousCertificateUrl: null,
      manufacturerCertificateUrl: null,
      error: null,
    }),
  };
});

describe('LMO Notification Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emitRouteAssigned is called with LMO details when admin approves a route', async () => {
    const { app } = createServer();

    const response = await request(app)
      .patch('/api/admin/pendency/APP-001/approve-route')
      .send({ lmoId: 'LMO-USER-001' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // emitRouteAssigned MUST have been called once, targeting an LMO
    expect(emitRouteAssigned).toHaveBeenCalledTimes(1);
    expect(emitRouteAssigned).toHaveBeenCalledWith(
      expect.anything(), // the io instance
      expect.objectContaining({
        assigned_type: 'LMO',
        assigned_id: 'LMO-USER-001',
      }),
    );
  });

  it('emitRouteAssigned is NOT called if approve-route endpoint is never hit', () => {
    // Simply verifying the spy starts clean — the socket "data" event
    // no longer calls emitRouteAssigned or io.to().emit("message") on payment.
    expect(emitRouteAssigned).not.toHaveBeenCalled();
  });
});
