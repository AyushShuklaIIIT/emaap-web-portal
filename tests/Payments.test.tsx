// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import Payments from '../client/pages/business/Payments';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GatewayApiProvider } from '../client/contexts/GatewayApiContext';

// Mock the navigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the usePaymentDashboard hook
vi.mock('../client/hooks/usePayments', () => ({
  usePaymentDashboard: vi.fn(() => ({
    data: {
      pending_payments: [
        {
          receipt_id: 'receipt-123',
          application_id: 'APP-001',
          instrument: 'Instrument A',
          statutory_fee: 500,
          due_date: '2026-10-01T00:00:00Z',
        }
      ],
      recent_transactions: []
    },
    isLoading: false,
    isError: false,
  }))
}));

describe('Payments Component', () => {
  it('navigates to new application when Pay Now is clicked', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <GatewayApiProvider>
          <BrowserRouter>
            <Payments userId="test-user" />
          </BrowserRouter>
        </GatewayApiProvider>
      </QueryClientProvider>
    );

    // Wait for the button to be available (or just find it if not async rendering)
    const payNowButton = await screen.findByText('Pay Now');
    
    fireEvent.click(payNowButton);
    
    // Ensure navigate was called with correct arguments
    expect(mockNavigate).toHaveBeenCalledWith(
      "/business/new-application", 
      { state: { receiptId: "receipt-123" } }
    );
  });
});
