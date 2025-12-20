import { describe, it, expect } from 'vitest';
import { formatCompactInt } from '../../components/layout/PerformanceWidget';

describe('formatCompactInt', () => {
  it('formats values < 1000 as-is', () => {
    expect(formatCompactInt(999)).toBe('999');
  });

  it('formats 11000 as 11k', () => {
    expect(formatCompactInt(11000)).toBe('11k');
  });

  it('formats 11500 as rounded k (12k)', () => {
    expect(formatCompactInt(11500)).toBe('12k');
  });

  it('formats 1500 with one decimal (1.5k)', () => {
    expect(formatCompactInt(1500)).toBe('1.5k');
  });
});


