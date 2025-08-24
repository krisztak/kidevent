import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventCard } from '../../client/src/components/event-card';
import type { EventWithSupervisor } from '../../shared/schema';

describe('EventCard', () => {
  let queryClient: QueryClient;
  
  const mockEvent: EventWithSupervisor = {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'A test event description',
    location: 'Test Location',
    startTime: new Date('2025-08-25T10:00:00Z').toISOString(),
    endTime: new Date('2025-08-25T12:00:00Z').toISOString(),
    capacity: 10,
    registeredCount: 3,
    creditCost: 2,
    cutoffHours: 6,
    allowedRegistrants: 'attendee',
    extraServices: [],
    supervisorId: 'supervisor-id',
    supervisorName: 'Test Supervisor',
    category: 'afterschool'
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderCard = (event = mockEvent, onClick = jest.fn()) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <EventCard event={event} onClick={onClick} />
      </QueryClientProvider>
    );
  };

  describe('Event Information Display', () => {
    test('displays event title and location', () => {
      renderCard();
      
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Test Location')).toBeInTheDocument();
    });

    test('displays formatted date and time', () => {
      renderCard();
      
      expect(screen.getByText(/Sunday, August 24/)).toBeInTheDocument();
      expect(screen.getByText(/3:22 PM/)).toBeInTheDocument();
    });

    test('displays credit cost', () => {
      renderCard();
      
      expect(screen.getByTestId('text-credit-cost')).toHaveTextContent('2');
    });

    test('displays capacity information', () => {
      renderCard();
      
      expect(screen.getByTestId('text-spots-left')).toHaveTextContent('7');
      expect(screen.getByTestId('text-total-capacity')).toHaveTextContent('10');
    });

    test('displays supervisor information when available', () => {
      renderCard();
      
      expect(screen.getByText(/Supervisor: Test Supervisor/)).toBeInTheDocument();
    });
  });

  describe('Capacity Status', () => {
    test('shows spots available when not full', () => {
      renderCard();
      
      const spotsLeft = screen.getByTestId('text-spots-left');
      expect(spotsLeft).toHaveTextContent('7');
      expect(spotsLeft.closest('div')).toHaveClass('text-green-600');
    });

    test('shows fully booked status when capacity reached', () => {
      const fullyBookedEvent = {
        ...mockEvent,
        registeredCount: 10
      };
      
      renderCard(fullyBookedEvent);
      
      expect(screen.getByText('Fully Booked')).toBeInTheDocument();
    });

    test('shows nearly full status when few spots remaining', () => {
      const nearlyFullEvent = {
        ...mockEvent,
        registeredCount: 9
      };
      
      renderCard(nearlyFullEvent);
      
      const spotsLeft = screen.getByTestId('text-spots-left');
      expect(spotsLeft).toHaveTextContent('1');
      expect(spotsLeft.closest('div')).toHaveClass('text-yellow-600');
    });
  });

  describe('Event Categories', () => {
    test('displays correct icon for afterschool category', () => {
      renderCard();
      
      expect(screen.getByText('📚')).toBeInTheDocument();
      expect(screen.getByText('afterschool')).toBeInTheDocument();
    });

    test('displays different categories correctly', () => {
      const sportsEvent = {
        ...mockEvent,
        category: 'sports' as const
      };
      
      renderCard(sportsEvent);
      
      expect(screen.getByText('⚽')).toBeInTheDocument();
      expect(screen.getByText('sports')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    test('calls onClick when card is clicked', () => {
      const mockOnClick = jest.fn();
      renderCard(mockEvent, mockOnClick);
      
      const card = screen.getByTestId('card-event-test-event-id');
      fireEvent.click(card);
      
      expect(mockOnClick).toHaveBeenCalledWith(mockEvent);
    });

    test('has correct accessibility attributes', () => {
      renderCard();
      
      const card = screen.getByTestId('card-event-test-event-id');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Registration Deadline Warning', () => {
    test('shows warning when deadline is approaching', () => {
      const soonEvent = {
        ...mockEvent,
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now (less than 6 hour cutoff)
      };
      
      renderCard(soonEvent);
      
      expect(screen.getByText(/Registration deadline has passed/)).toBeInTheDocument();
    });

    test('does not show warning when deadline is far away', () => {
      const futureEvent = {
        ...mockEvent,
        startTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString() // 10 hours from now
      };
      
      renderCard(futureEvent);
      
      expect(screen.queryByText(/Registration deadline/)).not.toBeInTheDocument();
    });
  });
});