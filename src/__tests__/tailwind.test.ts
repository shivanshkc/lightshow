import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Tailwind Configuration', () => {
  it('has custom dark theme colors defined in CSS', () => {
    const cssPath = resolve(__dirname, '../index.css');
    const css = readFileSync(cssPath, 'utf-8');
    
    expect(css).toContain('--color-base');
    expect(css).toContain('--color-panel');
    expect(css).toContain('--color-accent');
  });

  it('has gizmo colors defined', () => {
    const cssPath = resolve(__dirname, '../index.css');
    const css = readFileSync(cssPath, 'utf-8');
    
    expect(css).toContain('--color-gizmo-x');
    expect(css).toContain('--color-gizmo-y');
    expect(css).toContain('--color-gizmo-z');
  });

  it('imports tailwindcss', () => {
    const cssPath = resolve(__dirname, '../index.css');
    const css = readFileSync(cssPath, 'utf-8');
    
    expect(css).toContain('@import "tailwindcss"');
  });
});
