import { describe, it, expect } from 'vitest';
import { median } from '../bench/stats';

describe('bench stats', () => {
  describe('median', () => {
    it('returns null for empty list', () => {
      expect(median([])).toBeNull();
    });

    it('returns the middle value for odd count', () => {
      expect(median([3, 1, 2])).toBe(2);
    });

    it('returns the average of the two middle values for even count', () => {
      expect(median([4, 1, 2, 3])).toBe(2.5);
    });
  });
});


