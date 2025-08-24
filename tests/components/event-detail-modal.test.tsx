import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventDetailModal } from '../../client/src/components/event-detail-modal';
import type { EventWithSupervisor, Child } from '../../shared/schema';

// Mock the API request function
jest.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: jest.fn(),
}));

// Mock the authentication hook
jest.mock('../../client/src/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { 
      id: 'test-user-id', 
      firstName: 'John', 
      lastName: 'Doe',
      role: 'user' 
    },
    isAuthenticated: true
  }))
}));

// Mock the toast hook
jest.mock('../../client/src/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn()
  }))
}));

describe('EventDetailModal', () => {
  let queryClient: QueryClient;
  
  const mockEvent: EventWithSupervisor = {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'A test event description',
    location: 'Test Location',
    startTime: new Date('2025-08-25T10:00:00Z').toISOString(),
    endTime: new Date('2025-08-25T12:00:00Z').toISOString(),
    capacity: 10,
    registeredCount: 5,
    creditCost: 2,
    cutoffHours: 6,
    allowedRegistrants: 'attendee',
    extraServices: [],
    supervisorId: 'supervisor-id',
    supervisorName: 'Test Supervisor',
    category: 'afterschool'
  };

  const mockChildren: Child[] = [
    {
      id: 'child-1',
      firstName: 'Alice',
      lastName: 'Doe',
      dateOfBirth: '2015-05-15',
      parentId: 'test-user-id',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '555-1234',
      allergies: '',
      dietaryRestrictions: '',
      medicalInfo: ''
    },
    {
      id: 'child-2', 
      firstName: 'Bob',
      lastName: 'Doe',
      dateOfBirth: '2017-03-20',
      parentId: 'test-user-id',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '555-1234',
      allergies: 'Nuts',
      dietaryRestrictions: 'Vegetarian',
      medicalInfo: ''
    }
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderModal = (event = mockEvent, children = mockChildren) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <EventDetailModal 
          event={event} 
          children={children} 
          onClose={jest.fn()} 
        />
      </QueryClientProvider>
    );
  };

  describe('Event Information Display', () => {
    test('displays event title and basic information', () => {
      renderModal();
      
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('A test event description')).toBeInTheDocument();
      expect(screen.getByText('Test Location')).toBeInTheDocument();
    });

    test('displays capacity and spots information', () => {
      renderModal();
      
      expect(screen.getByTestId('text-credits-required')).toHaveTextContent('2');
      expect(screen.getByTestId('text-spots-left')).toHaveTextContent('5');
      expect(screen.getByTestId('text-total-spots')).toHaveTextContent('10');
    });

    test('displays supervisor information when available', () => {
      renderModal();
      
      expect(screen.getByText(/Supervisor: Test Supervisor/)).toBeInTheDocument();
    });

    test('displays registration deadline information', () => {
      renderModal();
      
      expect(screen.getByText(/Registration closes 6 hours before the event/)).toBeInTheDocument();
    });
  });

  describe('Registration Section Collapsible Behavior', () => {
    test('registration section starts collapsed by default', () => {
      renderModal();
      
      // Registration button should be clickable but content should be hidden
      const registerButton = screen.getByRole('button', { name: /Register for Event/ });
      expect(registerButton).toBeInTheDocument();
      
      // Registration content should not be visible initially
      expect(screen.queryByText('Who is registering?')).not.toBeInTheDocument();
    });

    test('expands registration section when clicked', async () => {
      renderModal();
      
      const registerButton = screen.getByRole('button', { name: /Register for Event/ });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Who is registering?')).toBeInTheDocument();
      });
    });

    test('collapses registration section when clicked again', async () => {
      renderModal();
      
      const registerButton = screen.getByRole('button', { name: /Register for Event/ });
      
      // Expand first
      fireEvent.click(registerButton);
      await waitFor(() => {
        expect(screen.getByText('Who is registering?')).toBeInTheDocument();
      });
      
      // Collapse again
      fireEvent.click(registerButton);
      await waitFor(() => {
        expect(screen.queryByText('Who is registering?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Registration Options', () => {
    beforeEach(async () => {
      renderModal();
      // Expand the registration section first
      const registerButton = screen.getByRole('button', { name: /Register for Event/ });
      fireEvent.click(registerButton);
      await waitFor(() => {
        expect(screen.getByText('Who is registering?')).toBeInTheDocument();
      });
    });

    test('displays parent registration option as disabled for attendee-only events', async () => {
      const parentOption = screen.getByTestId('option-parent');
      expect(parentOption).toHaveClass('opacity-50');
      expect(screen.getByText('Not allowed')).toBeInTheDocument();
    });

    test('displays all children as registration options', async () => {
      expect(screen.getByTestId('option-child-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('option-child-child-2')).toBeInTheDocument();
      
      expect(screen.getByText('Alice Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Doe')).toBeInTheDocument();
    });

    test('allows selecting a child for registration', async () => {
      const aliceOption = screen.getByTestId('option-child-child-1');
      fireEvent.click(aliceOption);
      
      // Should show selected state
      expect(aliceOption).toHaveClass('border-primary-green');
      expect(aliceOption).toHaveClass('bg-green-50');
    });

    test('displays event permission info correctly for children-only events', async () => {
      expect(screen.getByText('This event is open to children only')).toBeInTheDocument();
    });
  });

  describe('Event Status Handling', () => {
    test('shows fully booked message when capacity reached', () => {
      const fullyBookedEvent = {
        ...mockEvent,
        registeredCount: 10 // Same as capacity
      };
      
      renderModal(fullyBookedEvent);
      
      expect(screen.getByText('This event is fully booked')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Register for Event/ })).not.toBeInTheDocument();
    });

    test('shows deadline passed message when cutoff time reached', () => {
      const pastCutoffEvent = {
        ...mockEvent,
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() // 3 hours from now (less than 6 hour cutoff)
      };
      
      renderModal(pastCutoffEvent);
      
      expect(screen.getByText('Registration deadline has passed')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Register for Event/ })).not.toBeInTheDocument();
    });
  });

  describe('Different Event Types', () => {
    test('handles parent-only events correctly', async () => {
      const parentOnlyEvent = {
        ...mockEvent,
        allowedRegistrants: 'user' as const
      };
      
      renderModal(parentOnlyEvent);
      
      const registerButton = screen.getByRole('button', { name: /Register for Event/ });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('This event is open to parents only')).toBeInTheDocument();
      });
    });

    test('handles mixed events correctly', async () => {
      const mixedEvent = {
        ...mockEvent,
        allowedRegistrants: 'both' as const
      };
      
      renderModal(mixedEvent);
      
      const registerButton = screen.getByRole('button', { name: /Register for Event/ });
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getByText('This event is open to both parents and children')).toBeInTheDocument();
      });
    });
  });
});