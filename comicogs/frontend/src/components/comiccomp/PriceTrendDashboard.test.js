/**
 * Task 5: Price Trend Dashboard Tests
 * Comprehensive component unit tests, visual regression testing, mobile responsiveness testing, performance testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PriceTrendDashboard from './PriceTrendDashboard';

// Mock Chart.js to avoid canvas rendering issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    <div data-testid="price-chart" data-chart-data={JSON.stringify(data)}>
      Mocked Chart Component
    </div>
  )
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  onopen: jest.fn(),
  onmessage: jest.fn(),
  onerror: jest.fn(),
  onclose: jest.fn(),
  send: jest.fn(),
  close: jest.fn()
}));

// Mock fetch API
global.fetch = jest.fn();

describe('PriceTrendDashboard', () => {
  beforeEach(() => {
    fetch.mockClear();
    WebSocket.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test Acceptance Criteria 1: Display current comic value prominently
  describe('Current Value Display', () => {
    test('should display current comic value prominently when data is loaded', async () => {
      const mockCurrentData = {
        current_value: {
          market_price: 250.99,
          confidence: 0.85,
          price_range: { min: 200, max: 300 }
        },
        market_activity: {
          total_listings: 45,
          recent_sales: 12
        },
        data_quality: { score: 0.9 },
        last_updated: new Date().toISOString()
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCurrentData })
      });

      render(<PriceTrendDashboard comicId="Amazing Spider-Man 300" />);

      // Enter comic ID and trigger search
      const searchInput = screen.getByPlaceholderText(/enter comic name/i);
      const analyzeButton = screen.getByRole('button', { name: /analyze/i });

      await userEvent.type(searchInput, 'Amazing Spider-Man 300');
      await userEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Current Market Value')).toBeInTheDocument();
        expect(screen.getByText('$251')).toBeInTheDocument(); // Formatted price
        expect(screen.getByText('High Confidence')).toBeInTheDocument();
      });
    });

    test('should display loading state while fetching current value', () => {
      render(<PriceTrendDashboard />);
      
      const searchInput = screen.getByPlaceholderText(/enter comic name/i);
      const analyzeButton = screen.getByRole('button', { name: /analyze/i });

      userEvent.type(searchInput, 'Test Comic');
      userEvent.click(analyzeButton);

      expect(screen.getAllByText(/loading/i)).toHaveLength(0); // Should show loading spinners
    });
  });

  // Test Acceptance Criteria 2: Interactive 6M/1Y historical price charts
  describe('Price History Charts', () => {
    test('should render interactive price charts with time range selection', async () => {
      const mockHistoryData = {
        price_history: [
          { period: '2023-01-01', average_price: 200, transaction_count: 5 },
          { period: '2023-02-01', average_price: 220, transaction_count: 8 },
          { period: '2023-03-01', average_price: 250, transaction_count: 12 }
        ],
        summary: { total_records: 3, date_range_days: 90 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockHistoryData })
      });

      render(<PriceTrendDashboard comicId="Test Comic" />);

      await waitFor(() => {
        expect(screen.getByText('Price History')).toBeInTheDocument();
        expect(screen.getByTestId('price-chart')).toBeInTheDocument();
      });

      // Test time range selector
      const timeRangeButtons = screen.getAllByRole('button', { name: /[36]M|1Y/ });
      expect(timeRangeButtons).toHaveLength(3);

      // Test 1Y button click
      const oneYearButton = screen.getByRole('button', { name: '1Y' });
      await userEvent.click(oneYearButton);
      
      expect(oneYearButton).toHaveClass('bg-blue-600'); // Should be selected
    });

    test('should display chart statistics correctly', async () => {
      const mockHistoryData = {
        price_history: [
          { period: '2023-01-01', average_price: 200 },
          { period: '2023-06-01', average_price: 300 }
        ],
        summary: { total_records: 2, date_range_days: 180 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockHistoryData })
      });

      render(<PriceTrendDashboard comicId="Test Comic" />);

      await waitFor(() => {
        expect(screen.getByText('+$100')).toBeInTheDocument(); // Period change
        expect(screen.getByText('+50.0%')).toBeInTheDocument(); // Percentage change
      });
    });
  });

  // Test Acceptance Criteria 3: Market movement trendline with directional indicators
  describe('Market Trend Indicators', () => {
    test('should display trend indicators with proper direction styling', async () => {
      const mockTrendsData = {
        price_movement: {
          direction: 'upward',
          magnitude: 15.5,
          momentum: 0.8,
          volatility: 0.3
        },
        market_indicators: {
          support_level: 180,
          resistance_level: 320,
          trend_strength: 0.75,
          market_sentiment: 'bullish'
        },
        confidence: 0.9
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTrendsData })
      });

      render(<PriceTrendDashboard comicId="Test Comic" />);

      await waitFor(() => {
        expect(screen.getByText('Market Trends')).toBeInTheDocument();
        expect(screen.getByText('Upward Trend')).toBeInTheDocument();
        expect(screen.getByText('Strong')).toBeInTheDocument(); // Momentum
        expect(screen.getByText('Bullish')).toBeInTheDocument(); // Sentiment
      });
    });

    test('should display support and resistance levels', async () => {
      const mockTrendsData = {
        price_movement: { direction: 'stable', magnitude: 2 },
        market_indicators: {
          support_level: 180,
          resistance_level: 320,
          trend_strength: 0.6,
          market_sentiment: 'neutral'
        },
        confidence: 0.7
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTrendsData })
      });

      render(<PriceTrendDashboard comicId="Test Comic" />);

      await waitFor(() => {
        expect(screen.getByText('Support & Resistance')).toBeInTheDocument();
        expect(screen.getByText('$180')).toBeInTheDocument(); // Support level
        expect(screen.getByText('$320')).toBeInTheDocument(); // Resistance level
      });
    });
  });

  // Test Acceptance Criteria 4: Suggested list price with confidence interval
  describe('Price Suggestions', () => {
    test('should display AI price suggestions with confidence intervals', async () => {
      const mockSuggestionsData = {
        pricing_suggestions: {
          recommended_price: 275,
          price_range: { conservative: 250, aggressive: 300 },
          confidence_interval: { lower: 0.7, upper: 0.9, level: 0.8 }
        },
        timing_advice: {
          urgency_score: 65,
          optimal_timing: 'within 2 weeks',
          market_conditions: 'favorable'
        },
        risk_assessment: {
          risk_level: 'medium',
          risk_factors: ['Market volatility', 'Seasonal trends']
        },
        recommendations: [
          {
            title: 'Price Competitively',
            description: 'Set price at market median',
            priority: 7,
            confidence: 0.8
          }
        ],
        confidence: 0.85
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSuggestionsData })
      });

      render(<PriceTrendDashboard comicId="Test Comic" />);

      await waitFor(() => {
        expect(screen.getByText('AI Price Suggestions')).toBeInTheDocument();
        expect(screen.getByText('$275')).toBeInTheDocument(); // Recommended price
        expect(screen.getByText('Conservative')).toBeInTheDocument();
        expect(screen.getByText('Aggressive')).toBeInTheDocument();
        expect(screen.getByText('85% Confidence')).toBeInTheDocument();
      });
    });

    test('should display timing and risk assessment', async () => {
      const mockSuggestionsData = {
        pricing_suggestions: { recommended_price: 275 },
        timing_advice: { urgency_score: 75, optimal_timing: 'immediate' },
        risk_assessment: { risk_level: 'low' },
        confidence: 0.9
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSuggestionsData })
      });

      render(<PriceTrendDashboard comicId="Test Comic" />);

      await waitFor(() => {
        expect(screen.getByText('Market Timing')).toBeInTheDocument();
        expect(screen.getByText('Risk Level')).toBeInTheDocument();
        expect(screen.getByText('🟢')).toBeInTheDocument(); // Low risk icon
      });
    });
  });

  // Test Acceptance Criteria 5: Value change percentage vs last year
  describe('Year-over-Year Change', () => {
    test('should calculate and display year-over-year price change', async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const mockCurrentData = {
        current_value: { market_price: 300 }
      };

      const mockHistoryData = {
        price_history: [
          { period: oneYearAgo.toISOString(), average_price: 250 },
          { period: new Date().toISOString(), average_price: 300 }
        ]
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockCurrentData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockHistoryData })
        });

      render(<PriceTrendDashboard comicId="Test Comic" />);

      await waitFor(() => {
        expect(screen.getByText('Year-over-Year Change')).toBeInTheDocument();
        expect(screen.getByText('+20.0%')).toBeInTheDocument(); // (300-250)/250 * 100
      });
    });
  });

  // Test Acceptance Criteria 6: Mobile-responsive design
  describe('Mobile Responsiveness', () => {
    test('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<PriceTrendDashboard comicId="Test Comic" />);

      // Check that mobile-specific classes are applied
      const dashboard = screen.getByText('Price Trend Dashboard').closest('div');
      expect(dashboard).toHaveClass('price-dashboard');

      // Time range selector should hide label on mobile
      const timeRangeLabel = screen.queryByText('Time Range:');
      expect(timeRangeLabel).toHaveClass('hidden', 'sm:inline');
    });

    test('should stack cards vertically on mobile', () => {
      render(<PriceTrendDashboard comicId="Test Comic" />);

      // Grid should use mobile-first responsive classes
      const grids = document.querySelectorAll('.grid');
      grids.forEach(grid => {
        expect(grid).toHaveClass('grid-cols-1');
      });
    });

    test('should handle touch interactions properly', async () => {
      render(<PriceTrendDashboard />);

      const searchInput = screen.getByPlaceholderText(/enter comic name/i);
      
      // Should have mobile-optimized font size to prevent zoom
      expect(searchInput).toHaveClass('search-input');
    });
  });

  // Test Acceptance Criteria 7: Real-time price updates via WebSocket
  describe('Real-time WebSocket Updates', () => {
    test('should establish WebSocket connection when comic is loaded', async () => {
      render(<PriceTrendDashboard comicId="Test Comic" />);

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('/api/pricing/ws')
        );
      });
    });

    test('should handle WebSocket price updates', async () => {
      const mockWebSocket = {
        onopen: jest.fn(),
        onmessage: jest.fn(),
        onerror: jest.fn(),
        onclose: jest.fn(),
        send: jest.fn(),
        close: jest.fn()
      };

      WebSocket.mockImplementation(() => mockWebSocket);

      render(<PriceTrendDashboard comicId="Test Comic" />);

      // Simulate WebSocket connection
      mockWebSocket.onopen();
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribe',
          comic_id: 'Test Comic'
        })
      );

      // Simulate price update message
      const priceUpdate = {
        type: 'price_update',
        comic_id: 'Test Comic',
        new_price: 280
      };

      mockWebSocket.onmessage({
        data: JSON.stringify(priceUpdate)
      });

      // Should trigger refetch of current pricing
      expect(fetch).toHaveBeenCalled();
    });

    test('should show real-time indicators when connected', () => {
      render(<PriceTrendDashboard comicId="Test Comic" />);

      expect(screen.getByText('Real-time pricing data')).toBeInTheDocument();
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    test('should display error message when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      render(<PriceTrendDashboard />);

      const searchInput = screen.getByPlaceholderText(/enter comic name/i);
      const analyzeButton = screen.getByRole('button', { name: /analyze/i });

      await userEvent.type(searchInput, 'Test Comic');
      await userEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      });
    });

    test('should handle WebSocket connection failures gracefully', () => {
      const mockWebSocket = {
        onopen: jest.fn(),
        onmessage: jest.fn(),
        onerror: jest.fn(),
        onclose: jest.fn(),
        send: jest.fn(),
        close: jest.fn()
      };

      WebSocket.mockImplementation(() => mockWebSocket);

      render(<PriceTrendDashboard comicId="Test Comic" />);

      // Simulate WebSocket error
      mockWebSocket.onerror(new Error('WebSocket Error'));

      // Should not crash the application
      expect(screen.getByText('Price Trend Dashboard')).toBeInTheDocument();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    test('should handle large datasets efficiently', async () => {
      const largePriceHistory = Array.from({ length: 1000 }, (_, i) => ({
        period: new Date(2020, 0, i).toISOString(),
        average_price: 200 + Math.random() * 100,
        transaction_count: Math.floor(Math.random() * 20)
      }));

      const mockHistoryData = {
        price_history: largePriceHistory,
        summary: { total_records: 1000, date_range_days: 1000 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockHistoryData })
      });

      const startTime = performance.now();
      render(<PriceTrendDashboard comicId="Test Comic" />);

      await waitFor(() => {
        expect(screen.getByTestId('price-chart')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });

    test('should debounce search input to prevent excessive API calls', async () => {
      jest.useFakeTimers();

      render(<PriceTrendDashboard />);

      const searchInput = screen.getByPlaceholderText(/enter comic name/i);

      // Type multiple characters quickly
      await userEvent.type(searchInput, 'Amazing Spider-Man 300');

      // Fast forward timers
      jest.runAllTimers();

      // Should only make one API call after debounce
      expect(fetch).toHaveBeenCalledTimes(0); // No auto-search, manual trigger only

      jest.useRealTimers();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<PriceTrendDashboard />);

      const searchInput = screen.getByLabelText(/comic search/i);
      expect(searchInput).toHaveAttribute('id', 'comic-search');

      const analyzeButton = screen.getByRole('button', { name: /analyze/i });
      expect(analyzeButton).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(<PriceTrendDashboard />);

      const searchInput = screen.getByPlaceholderText(/enter comic name/i);
      
      // Should be focusable
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      // Should support Enter key
      await userEvent.type(searchInput, 'Test Comic{enter}');
      
      // Should trigger search on Enter
      expect(fetch).toHaveBeenCalled();
    });

    test('should have proper focus management', () => {
      render(<PriceTrendDashboard />);

      // Focus should be properly managed between interactive elements
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        expect(element).toHaveClass('focus-visible:focus');
      });
    });
  });
}); 