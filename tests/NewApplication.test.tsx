// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
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
      states: [
        { state_code: 'DL', state_name: 'Delhi' }
      ]
    },
    isLoading: false,
    error: null
  }))
}));

const mockCreateApplication = vi.fn().mockResolvedValue({ success: true, application_no: 'APP-999' });

vi.mock('../client/services/business/verificationApp.service', () => ({
  createVerificationApplication: (...args: any[]) => mockCreateApplication(...args),
  getVerificationCategories: vi.fn().mockResolvedValue([]),
  getVerificationDistricts: vi.fn().mockResolvedValue([]),
  getVerificationConditions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../client/services/business/payment.service', () => ({
  getPaymentReceipt: vi.fn().mockResolvedValue({
    statutory_fee: 500,
    adjusting_charges: 0,
    carriage_charges: 0,
    total_amount: 500,
    application: {
      app_type: 'INITIAL',
      instrument: {
        model_no: 'M123',
        manufacturer_name: 'Test Mfg',
        serial_number: 'SN123',
        metric: 'Weight',
        address: 'Test Address',
        pincode: 110001,
        lat: 28.6139,
        long: 77.2090,
        state: 'Delhi',
        district: { district_name: 'New Delhi' },
        category: { category_code: 'CAT1' }
      }
    }
  }),
}));

describe('NewApplication Component - Pay Now Flow', () => {
  it('submits the application from step 3 when loaded from a receipt', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <GatewayApiProvider>
          <MemoryRouter initialEntries={[{ pathname: '/business/new-application', state: { receiptId: 'receipt-123' } }]}>
            <Routes>
              <Route path="/business/new-application" element={<NewApplication />} />
            </Routes>
          </MemoryRouter>
        </GatewayApiProvider>
      </QueryClientProvider>
    );

    // Wait for the form to reach Step 1 (Location & Documents)
    const nextButton = await screen.findByRole('button', { name: /Next: Review & Payment/i });
    expect(nextButton).toBeInTheDocument();
    
    // Click next to go to Step 2 (Payment)
    fireEvent.click(nextButton);

    // Wait for Step 2 and the Pay button
    const payButton = await screen.findByRole('button', { name: /Pay ₹500/i });
    expect(payButton).toBeInTheDocument();

    // Click the final submit button
    fireEvent.click(payButton);

    // Ensure the API call was made to submit the application
    await waitFor(() => {
      expect(mockCreateApplication).toHaveBeenCalled();
    });
  });
});
