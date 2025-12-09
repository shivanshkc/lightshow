import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumberInput } from '../../components/ui/NumberInput';

describe('NumberInput', () => {
  it('displays formatted value', () => {
    render(<NumberInput value={3.14159} onChange={() => {}} precision={2} />);
    expect(screen.getByDisplayValue('3.14')).toBeDefined();
  });

  it('displays label when provided', () => {
    render(<NumberInput value={0} onChange={() => {}} label="X" />);
    expect(screen.getByText('X')).toBeDefined();
  });

  it('calls onChange on blur with valid value', () => {
    const onChange = vi.fn();
    render(<NumberInput value={0} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('clamps value to min', () => {
    const onChange = vi.fn();
    render(<NumberInput value={0} onChange={onChange} min={0} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '-10' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('clamps value to max', () => {
    const onChange = vi.fn();
    render(<NumberInput value={0} onChange={onChange} max={10} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('reverts to previous value on invalid input', () => {
    const onChange = vi.fn();
    render(<NumberInput value={5} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('5.00')).toBeDefined();
  });

  it('respects precision setting', () => {
    render(<NumberInput value={1.23456} onChange={() => {}} precision={3} />);
    expect(screen.getByDisplayValue('1.235')).toBeDefined();
  });

  it('increments value on ArrowUp key', () => {
    const onChange = vi.fn();
    render(<NumberInput value={5} onChange={onChange} step={0.1} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenCalledWith(5.1);
  });
});

