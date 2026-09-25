import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock prisma to prevent any database queries or connection attempts
vi.mock('../server/lib/prisma', () => ({
  prisma: {
    generatedCertificate: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

import { createServer } from '../server/app';

describe('Certificate Download API', () => {
  it('should not require authentication to download a certificate', async () => {
    // Create an instance of the express app
    const { app } = createServer();

    // Call the certificate download endpoint WITHOUT any auth token
    const response = await request(app)
      .get('/api/certificates/CERT-1234/download')
      .send();

    // It should not return 401 Unauthorized
    expect(response.status).not.toBe(401);
    
    // It should return 404 (Certificate not found) or 500 (if DB is not mocked), but NOT 401
    expect([404, 500]).toContain(response.status);
  });
});
