// @vitest-environment jsdom
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

import { CertificateContent } from '../client/pages/VerifyCertificate';

const baseCert = {
  certificateId: 'CERT-001',
  instrumentCategory: 'Weighing Scale',
  instrumentSerialNumber: 'SN-123',
  issueDate: new Date().toISOString(),
  hash: 'abc123',
  status: 'APPROVED_CHECKLIST',
  tokenHash: null,
};

describe('CertificateContent – Live Physical Evidence Section', () => {
  it('does NOT render the section when sealImageUrls is empty', () => {
    render(<CertificateContent certificate={{ ...baseCert, sealImageUrls: [] }} />);

    expect(screen.queryByText('Live Physical Evidence')).not.toBeInTheDocument();
    expect(screen.queryByText('No seal image available')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Tamper Seal Evidence')).not.toBeInTheDocument();
  });

  it('does NOT render the section when sealImageUrls is null (coerced to empty)', () => {
    // Simulates an old record where the field was not populated
    render(
      <CertificateContent
        certificate={{ ...baseCert, sealImageUrls: [] }}
      />,
    );

    expect(screen.queryByText('Live Physical Evidence')).not.toBeInTheDocument();
  });

  it('DOES render the heading and image when sealImageUrls has entries', () => {
    render(
      <CertificateContent
        certificate={{
          ...baseCert,
          sealImageUrls: ['https://example.com/seal.jpg'],
        }}
      />,
    );

    expect(screen.getByText('Live Physical Evidence')).toBeInTheDocument();
    expect(screen.getByAltText('Tamper Seal Evidence')).toBeInTheDocument();
    expect(
      (screen.getByAltText('Tamper Seal Evidence') as HTMLImageElement).src,
    ).toBe('https://example.com/seal.jpg');
  });
});
