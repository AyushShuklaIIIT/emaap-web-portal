import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma to test database updates and queries
vi.mock('../server/lib/prisma', () => {
  const mockApps: Record<string, any> = {
    'app-001': {
      app_id: 'app-001',
      application_no: 'EMAAP-VER-2026-0001',
      app_type: 'INITIAL',
      workflow_status: 'SUBMITTED', // SUBMITTED application
      submission_timestamp: new Date('2026-09-01'),
      business_id: 'bus-001',
      instrument_id: 'inst-001',
      business: {
        trade_name: 'Test Business',
        state: { state_code: 'DL' },
        user: { jurisdiction_district: { district_name: 'New Delhi' } }
      },
      instrument: {
        serial_number: 'SN-001',
        model_no: 'MOD-001',
        category: { category_name: 'Weighing Scale' }
      }
    },
    'app-002': {
      app_id: 'app-002',
      application_no: 'EMAAP-VER-2026-0002',
      app_type: 'INITIAL',
      workflow_status: 'ALLOCATED', // Not SUBMITTED
      submission_timestamp: new Date('2026-09-02'),
      business_id: 'bus-001',
      instrument_id: 'inst-002',
      business: {
        trade_name: 'Test Business 2',
        state: { state_code: 'DL' },
        user: { jurisdiction_district: { district_name: 'New Delhi' } }
      },
      instrument: {
        serial_number: 'SN-002',
        model_no: 'MOD-002',
        category: { category_name: 'Weighing Scale' }
      }
    }
  };

  return {
    prisma: {
      verificationApp: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          return Object.values(mockApps).filter(app => {
            if (where?.workflow_status && app.workflow_status !== where.workflow_status) {
              return false;
            }
            return true;
          });
        }),
        count: vi.fn().mockImplementation(({ where }) => {
          return Object.values(mockApps).filter(app => {
            if (where?.workflow_status && app.workflow_status !== where.workflow_status) {
              return false;
            }
            return true;
          }).length;
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          if (mockApps[where.app_id]) {
            mockApps[where.app_id] = { ...mockApps[where.app_id], ...data };
            return mockApps[where.app_id];
          }
          return null;
        }),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          return Object.values(mockApps).find(app => app.app_id === where?.app_id || app.application_no === where?.application_no) || null;
        }),
      },
      paymentReceipt: {
        upsert: vi.fn().mockImplementation(({ where, update, create }) => {
          return { receipt_id: 'rcpt-001', app_id: where.app_id, payment_status: 'SUCCESS' };
        })
      }
    }
  };
});

import { getPendencyApplications, countPendencyApplications } from '../server/repositories/pendencyAdmin.repository';
import { createPaymentReceiptRepo } from '../server/repositories/payment.repository';
import { prisma } from '../server/lib/prisma';

describe('Verification Application & Admin Pendency Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only fetches applications with workflow_status = "SUBMITTED" for Admin Pendency queue', async () => {
    const query = {
      stateCode: 'DL',
      slaStatus: 'ALL' as const,
      breachedBefore: new Date(),
      withinSlaFrom: new Date(),
      skip: 0,
      take: 10,
    };

    const count = await countPendencyApplications(query);
    const apps = await getPendencyApplications(query);

    // Only 'app-001' is SUBMITTED. 'app-002' is ALLOCATED and should NOT show in Admin Pendency queue.
    expect(count).toBe(1);
    expect(apps.length).toBe(1);
    expect(apps[0].application_no).toBe('EMAAP-VER-2026-0001');
    expect(apps[0].workflow_status).toBe('SUBMITTED');
  });

  it('updates verificationApp workflow_status to SUBMITTED when payment receipt is recorded', async () => {
    // Before payment, app-002 has workflow_status: ALLOCATED (or DRAFT)
    const initialQuery = {
      stateCode: 'DL',
      slaStatus: 'ALL' as const,
      breachedBefore: new Date(),
      withinSlaFrom: new Date(),
      skip: 0,
      take: 10,
    };

    const initialApps = await getPendencyApplications(initialQuery);
    expect(initialApps.some(app => app.app_id === 'app-002')).toBe(false);

    // Call createPaymentReceiptRepo for app-002
    await createPaymentReceiptRepo({
      receipt_id: 'rcpt-002',
      receipt_no: 'RCPT-002',
      transaction_id: 'TXN-002',
      payment_method: 'UPI',
      total_amount: 500,
      statutory_fee: 500,
      app_id: 'app-002',
    });

    // Ensure prisma.verificationApp.update was called or app-002 status is updated to SUBMITTED
    expect(prisma.verificationApp.update).toHaveBeenCalledWith({
      where: { app_id: 'app-002' },
      data: { workflow_status: 'SUBMITTED' },
    });

    // After updating workflow_status to SUBMITTED, app-002 should appear in Admin Pendency queue
    const updatedApps = await getPendencyApplications(initialQuery);
    expect(updatedApps.some(app => app.app_id === 'app-002')).toBe(true);
  });
});
