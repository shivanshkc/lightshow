import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconButton } from '../../components/ui/IconButton';

function DummyIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="4" />
    </svg>
  );
}

describe('IconButton', () => {
  it('renders a button with required aria-label', () => {
    render(<IconButton aria-label="Undo" icon={<DummyIcon />} />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDefined();
  });

  it('calls onClick', () => {
    const onClick = vi.fn();
    render(<IconButton aria-label="Undo" icon={<DummyIcon />} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled', () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Undo" icon={<DummyIcon />} onClick={onClick} disabled />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});


