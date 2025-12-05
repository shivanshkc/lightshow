import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../components/StatusBar';

describe('StatusBar', () => {
  it('renders sample count label', () => {
    render(<StatusBar renderer={null} />);
    expect(screen.getByText(/Samples:/)).toBeDefined();
  });

  it('renders FPS label', () => {
    render(<StatusBar renderer={null} />);
    expect(screen.getByText(/FPS:/)).toBeDefined();
  });

  it('renders with default values when no renderer', () => {
    render(<StatusBar renderer={null} />);
    expect(screen.getByText('Samples: 0')).toBeDefined();
    expect(screen.getByText('FPS: 0')).toBeDefined();
  });
});

