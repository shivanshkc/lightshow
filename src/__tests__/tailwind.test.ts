import { describe, it, expect } from 'vitest';
// @ts-expect-error - tailwind config is JS
import tailwindConfig from '../../tailwind.config.js';

describe('Tailwind Configuration', () => {
  it('has custom dark theme colors defined', () => {
    const colors = tailwindConfig.theme?.extend?.colors;
    
    expect(colors).toBeDefined();
    expect(colors?.base).toBe('#121212');
    expect(colors?.panel).toBe('#1E1E1E');
    expect(colors?.accent).toBe('#007ACC');
  });

  it('has gizmo colors defined', () => {
    const colors = tailwindConfig.theme?.extend?.colors;
    
    expect(colors?.['gizmo-x']).toBe('#E53935');
    expect(colors?.['gizmo-y']).toBe('#43A047');
    expect(colors?.['gizmo-z']).toBe('#1E88E5');
  });

  it('includes all source paths in content', () => {
    expect(tailwindConfig.content).toContain('./index.html');
    expect(tailwindConfig.content).toContain('./src/**/*.{js,ts,jsx,tsx}');
  });
});

