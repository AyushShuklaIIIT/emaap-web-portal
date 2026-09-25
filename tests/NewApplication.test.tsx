// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

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

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewApplication from '../client/pages/business/NewApplication';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GatewayApiProvider } from '../client/contexts/GatewayApiContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock hooks and services
vi.mock('../client/lib/current-user', () => ({
  getCurrentUser: vi.fn(() => ({ userId: 'test-user', role: 'business' })),
}));

vi.mock('../client/hooks/useVerificationMetaData', () => ({
  useVerificationMetadata: vi.fn(() => ({
    data: {
      categories: [{ category_code: 'CAT1', category_name: 'Test Category' }],
      states: [{ state_code: 'DL', state_name: 'Delhi' }],
    },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useVerificationMetaData', () => ({
  useVerificationMetadata: vi.fn(() => ({
    data: {
      categories: [{ category_code: 'CAT1', category_name: 'Test Category' }],
      states: [{ state_code: 'DL', state_name: 'Delhi' }],
    },
    isLoading: false,
    error: null,
  })),
}));

const mockCreateApplication = vi.fn().mockResolvedValue({
  success: true,
  application_no: 'APP-999',
});
const mockGeneratePaymentReceipt = vi.fn().mockResolvedValue({
  success: true,
  data: { receipt_id: 'receipt-123', receipt_no: 'REC-999' },
});

vi.mock('../client/services/business/verificationApp.service', () => ({
  getVerificationMetadata: vi.fn().mockResolvedValue({
    categories: [{ category_code: 'CAT1', category_name: 'Test Category' }],
    states: [{ state_code: 'DL', state_name: 'Delhi' }],
  }),
  createVerificationApplication: (...args: any[]) =>
    mockCreateApplication(...args),
  uploadVerificationDocuments: vi.fn().mockResolvedValue({
    applicationId: 'app-999',
    manufacturerFileUrl: 'https://example.com/invoice.pdf',
    prevCertificateFileUrl: null,
  }),
  generatePaymentReceiptAPI: (...args: any[]) =>
    mockGeneratePaymentReceipt(...args),
  getVerificationCategories: vi.fn().mockResolvedValue([
    { category_code: 'CAT1', category_name: 'Test Category', isApprovedForGatc: true },
  ]),
  getVerificationDistricts: vi.fn().mockResolvedValue([
    { district_id: 'd-1', district_code: 'ND', district_name: 'New Delhi' },
  ]),
  getVerificationConditions: vi.fn().mockResolvedValue([]),
  getVerificationFeeQuote: vi.fn().mockResolvedValue({
    statutoryFee: 500,
    additionalFee: 0,
    totalAmount: 500,
    feeBasis: 'Standard Rate',
  }),
}));

vi.mock('../client/services/business/payment.service', () => ({
  getPaymentReceipt: vi.fn().mockResolvedValue({
    statutory_fee: 500,
    adjusting_charges: 0,
    carriage_charges: 0,
    total_amount: 500,
    receipt_no: 'REC-123',
    application: {
      app_id: 'app-123',
      application_no: 'APP-123',
      app_type: 'INITIAL',
      instrument: {
        model_no: 'M123',
        manufacturer_name: 'Test Mfg',
        serial_number: 'SN123',
        metric: 'Weight',
        address: 'Test Address',
        pincode: 110001,
        lat: 28.6139,
        long: 77.209,
        state: 'Delhi',
        district: { district_name: 'New Delhi' },
        category: { category_code: 'CAT1', category_name: 'Test Category' },
      },
    },
  }),
}));

describe('NewApplication Component - Pay Now Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processes payment receipt and navigates when loaded from an existing receipt', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <GatewayApiProvider>
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/business/new-application',
                state: { receiptId: 'receipt-123' },
              },
            ]}
          >
            <Routes>
              <Route
                path="/business/new-application"
                element={<NewApplication />}
              />
            </Routes>
          </MemoryRouter>
        </GatewayApiProvider>
      </QueryClientProvider>,
    );

    // Wait for the form to reach Step 1 (Location & Documents)
    const nextButton = await screen.findByRole('button', {
      name: /Next: Review & Payment/i,
    });
    expect(nextButton).toBeInTheDocument();

    // Click next to go to Step 2 (Payment)
    fireEvent.click(nextButton);

    // Wait for Step 2 and the Pay button
    const payButton = await screen.findByRole('button', {
      name: /Pay ₹500/i,
    });
    expect(payButton).toBeInTheDocument();

    // Click the final submit button
    fireEvent.click(payButton);

    // Ensure generatePaymentReceiptAPI was called and user was navigated to confirmation
    await waitFor(() => {
      expect(mockGeneratePaymentReceipt).toHaveBeenCalledWith(
        'app-123',
        'UPI',
        500,
        500,
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        '/business/application-submitted',
        expect.objectContaining({
          state: expect.objectContaining({
            applicationId: 'APP-123',
            receiptNo: 'REC-123',
          }),
        }),
      );
    });
  });
});
