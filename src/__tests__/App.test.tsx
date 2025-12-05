import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Lightshow')).toBeDefined();
  });

  it('displays the subtitle', () => {
    render(<App />);
    expect(screen.getByText('WebGPU Raytracer')).toBeDefined();
  });
});

