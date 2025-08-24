import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../../client/src/hooks/useAuth';
import { apiRequest } from '../../client/src/lib/queryClient';

// Mock the API request function
jest.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('useAuth Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('User Authentication State', () => {
    test('returns authenticated user when API returns user data', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        profileComplete: true
      };

      // Mock successful API response
      mockApiRequest.mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('returns unauthenticated state when API returns 401', async () => {
      // Mock 401 unauthorized response
      mockApiRequest.mockRejectedValueOnce({
        response: { status: 401 }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('handles loading state correctly', () => {
      // Mock pending promise
      mockApiRequest.mockImplementationOnce(() => new Promise(() => {}));

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Role-based Access', () => {
    test('correctly identifies admin users', async () => {
      const adminUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        profileComplete: true
      };

      mockApiRequest.mockResolvedValueOnce(adminUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.role).toBe('admin');
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    test('correctly identifies staff users', async () => {
      const staffUser = {
        id: 'staff-id',
        email: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'User',
        role: 'staff',
        profileComplete: true
      };

      mockApiRequest.mockResolvedValueOnce(staffUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.role).toBe('staff');
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    test('correctly identifies regular users', async () => {
      const regularUser = {
        id: 'user-id',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
        profileComplete: true
      };

      mockApiRequest.mockResolvedValueOnce(regularUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.role).toBe('user');
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Profile Completion Status', () => {
    test('identifies complete profiles correctly', async () => {
      const completeUser = {
        id: 'user-id',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-1234',
        role: 'user',
        profileComplete: true
      };

      mockApiRequest.mockResolvedValueOnce(completeUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.profileComplete).toBe(true);
      });
    });

    test('identifies incomplete profiles correctly', async () => {
      const incompleteUser = {
        id: 'user-id',
        email: 'user@example.com',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'user',
        profileComplete: false
      };

      mockApiRequest.mockResolvedValueOnce(incompleteUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.profileComplete).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      const networkError = new Error('Network error');
      mockApiRequest.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('handles server errors gracefully', async () => {
      const serverError = {
        response: { status: 500 }
      };
      mockApiRequest.mockRejectedValueOnce(serverError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});