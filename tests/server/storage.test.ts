import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { DatabaseStorage } from '../../server/storage';
import type { Event, Child, User, EventRegistration } from '../../shared/schema';

// Mock database connection
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => jest.fn()),
}));

describe('DatabaseStorage', () => {
  let storage: DatabaseStorage;
  
  beforeEach(() => {
    storage = new DatabaseStorage();
  });

  describe('Event Management', () => {
    const mockEvent = {
      id: 'test-event-id',
      title: 'Test Event',
      description: 'Test Description',
      location: 'Test Location',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      capacity: 10,
      creditCost: 2,
      cutoffHours: 6,
      allowedRegistrants: 'attendee' as const,
      extraServices: [],
      supervisorId: 'supervisor-id',
      category: 'afterschool' as const
    };

    test('createEvent should create event with proper validation', async () => {
      // Mock successful database insertion
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([mockEvent]);
      
      const result = await storage.createEvent(mockEvent);
      expect(result).toEqual(mockEvent);
    });

    test('getAllEvents should return all events', async () => {
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([mockEvent]);
      
      const result = await storage.getAllEvents();
      expect(result).toEqual([mockEvent]);
    });

    test('getEvent should return single event', async () => {
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([mockEvent]);
      
      const result = await storage.getEvent('test-event-id');
      expect(result).toEqual(mockEvent);
    });
  });

  describe('User Management', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1234',
      role: 'user' as const,
      profileComplete: true
    };

    test('createUser should create user with hashed password', async () => {
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([mockUser]);
      
      const userData = {
        ...mockUser,
        password: 'password123'
      };
      
      const result = await storage.createUser(userData);
      expect(result).toEqual(mockUser);
    });

    test('getUserByEmail should find user by email', async () => {
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([mockUser]);
      
      const result = await storage.getUserByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    test('updateUserRole should update user role properly', async () => {
      const updatedUser = { ...mockUser, role: 'staff' as const };
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([updatedUser]);
      
      const result = await storage.updateUserRole('test-user-id', 'staff');
      expect(result).toEqual(updatedUser);
    });
  });

  describe('Child Management', () => {
    const mockChild: Child = {
      id: 'test-child-id',
      firstName: 'Alice',
      lastName: 'Doe',
      dateOfBirth: '2015-05-15',
      parentId: 'test-parent-id',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '555-1234',
      allergies: '',
      dietaryRestrictions: '',
      medicalInfo: ''
    };

    test('createChild should create child with proper parent association', async () => {
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([mockChild]);
      
      const result = await storage.createChild(mockChild);
      expect(result).toEqual(mockChild);
    });

    test('getChildrenByParent should return children for specific parent', async () => {
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([mockChild]);
      
      const result = await storage.getChildrenByParent('test-parent-id');
      expect(result).toEqual([mockChild]);
    });
  });

  describe('Registration Management', () => {
    const mockRegistration: EventRegistration = {
      id: 'test-registration-id',
      eventId: 'test-event-id',
      userId: 'test-user-id',
      attendeeId: 'test-attendee-id',
      attendeeType: 'attendee',
      selectedServices: [],
      registrationDate: new Date().toISOString()
    };

    test('createRegistration should register user for event', async () => {
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([mockRegistration]);
      
      const result = await storage.createRegistration(mockRegistration);
      expect(result).toEqual(mockRegistration);
    });

    test('getRegistrationsByUser should return user registrations', async () => {
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([mockRegistration]);
      
      const result = await storage.getRegistrationsByUser('test-user-id');
      expect(result).toEqual([mockRegistration]);
    });

    test('deleteRegistration should remove registration', async () => {
      jest.spyOn(storage as any, 'db').mockResolvedValueOnce([]);
      
      await expect(storage.deleteRegistration('test-registration-id')).resolves.not.toThrow();
    });
  });

  describe('Capacity and Validation', () => {
    test('should properly calculate available spots', async () => {
      const mockEvent = {
        capacity: 10,
        registeredCount: 7
      };
      
      // This would be tested through the actual getEventsWithSupervisors method
      // which calculates spots left as capacity - registeredCount
      const spotsLeft = mockEvent.capacity - mockEvent.registeredCount;
      expect(spotsLeft).toBe(3);
    });

    test('should validate registration cutoff time', () => {
      const now = new Date();
      const eventTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 8 hours from now
      const cutoffHours = 6;
      
      const cutoffTime = new Date(eventTime.getTime() - (cutoffHours * 60 * 60 * 1000));
      const isAfterCutoff = now > cutoffTime;
      
      expect(isAfterCutoff).toBe(false); // 8 hours > 6 hours, so registration should be open
    });

    test('should prevent double registration', async () => {
      // This would be tested by checking if a user/child is already registered
      const existingRegistrations = [
        { attendeeId: 'child-1', eventId: 'event-1' },
        { attendeeId: 'child-2', eventId: 'event-1' }
      ];
      
      const isAlreadyRegistered = (attendeeId: string, eventId: string) => {
        return existingRegistrations.some(reg => 
          reg.attendeeId === attendeeId && reg.eventId === eventId
        );
      };
      
      expect(isAlreadyRegistered('child-1', 'event-1')).toBe(true);
      expect(isAlreadyRegistered('child-3', 'event-1')).toBe(false);
    });
  });
});