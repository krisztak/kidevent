import { isUnauthorizedError } from '../../client/src/lib/authUtils';

describe('Auth Utils', () => {
  describe('isUnauthorizedError', () => {
    test('returns true for 401 status error', () => {
      const error = {
        response: {
          status: 401
        }
      };
      
      expect(isUnauthorizedError(error)).toBe(true);
    });

    test('returns false for non-401 status error', () => {
      const error = {
        response: {
          status: 500
        }
      };
      
      expect(isUnauthorizedError(error)).toBe(false);
    });

    test('returns false for error without response', () => {
      const error = {
        message: 'Network error'
      };
      
      expect(isUnauthorizedError(error)).toBe(false);
    });

    test('returns false for null/undefined error', () => {
      expect(isUnauthorizedError(null)).toBe(false);
      expect(isUnauthorizedError(undefined)).toBe(false);
    });

    test('returns false for error without status', () => {
      const error = {
        response: {}
      };
      
      expect(isUnauthorizedError(error)).toBe(false);
    });
  });
});