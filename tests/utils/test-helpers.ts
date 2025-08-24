/**
 * Test utilities and helpers for the RightHere test suite
 */

export const createMockEvent = (overrides = {}) => ({
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
  allowedRegistrants: 'attendee' as const,
  extraServices: [],
  supervisorId: 'supervisor-id',
  supervisorName: 'Test Supervisor',
  category: 'afterschool' as const,
  ...overrides
});

export const createMockChild = (overrides = {}) => ({
  id: 'test-child-id',
  firstName: 'Alice',
  lastName: 'Doe',
  dateOfBirth: '2015-05-15',
  parentId: 'test-parent-id',
  emergencyContact: 'Jane Doe',
  emergencyPhone: '555-1234',
  allergies: '',
  dietaryRestrictions: '',
  medicalInfo: '',
  ...overrides
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-1234',
  role: 'user' as const,
  profileComplete: true,
  ...overrides
});

export const createMockRegistration = (overrides = {}) => ({
  id: 'test-registration-id',
  eventId: 'test-event-id',
  userId: 'test-user-id',
  attendeeId: 'test-attendee-id',
  attendeeType: 'attendee' as const,
  selectedServices: [],
  registrationDate: new Date().toISOString(),
  ...overrides
});

export const mockQueryClient = {
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
};

export const mockApiRequest = jest.fn();

export const mockToast = jest.fn();

export const waitForTestCondition = (condition: () => boolean, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (condition()) {
        resolve(true);
      } else if (Date.now() - start > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};