import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

describe('SegmentedControl', () => {
  it('renders options and indicates selected via aria-pressed', () => {
    render(
      <SegmentedControl
        label="Mode"
        value="w"
        onChange={() => {}}
        options={[
          { value: 'w', label: 'W' },
          { value: 'e', label: 'E' },
          { value: 'r', label: 'R' },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'W' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'E' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onChange with clicked option', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        value="w"
        onChange={onChange}
        options={[
          { value: 'w', label: 'W' },
          { value: 'e', label: 'E' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'E' }));
    expect(onChange).toHaveBeenCalledWith('e');
  });
});


