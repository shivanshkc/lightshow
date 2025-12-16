import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Slider } from '../../components/ui/Slider';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { Select } from '../../components/ui/Select';

describe('Slider', () => {
  it('displays label', () => {
    render(<Slider label="IOR" value={1.5} onChange={() => {}} />);
    expect(screen.getByText('IOR')).toBeDefined();
  });

  it('displays formatted value', () => {
    render(<Slider label="Test" value={0.5} onChange={() => {}} />);
    expect(screen.getByText('0.50')).toBeDefined();
  });

  it('uses custom format function', () => {
    render(
      <Slider
        label="Test"
        value={1.5}
        onChange={() => {}}
        formatValue={(v) => `${v.toFixed(1)}x`}
      />
    );
    expect(screen.getByText('1.5x')).toBeDefined();
  });

  it('hides value when displayValue is false', () => {
    render(
      <Slider label="Test" value={0.5} onChange={() => {}} displayValue={false} />
    );
    expect(screen.queryByText('0.50')).toBeNull();
  });
});

describe('ColorPicker', () => {
  it('displays label', () => {
    render(<ColorPicker label="Color" value={[1, 0, 0]} onChange={() => {}} />);
    expect(screen.getByText('Color')).toBeDefined();
  });

  it('converts RGB to hex correctly', () => {
    render(<ColorPicker label="Color" value={[1, 0, 0]} onChange={() => {}} />);
    expect(screen.getByDisplayValue('#FF0000')).toBeDefined();
  });

  it('converts RGB with fractional values correctly', () => {
    render(
      <ColorPicker label="Color" value={[0.5, 0.5, 0.5]} onChange={() => {}} />
    );
    // Multiple elements with same value (text input + hidden color input)
    const inputs = screen.getAllByDisplayValue('#808080');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('calls onChange with parsed hex value', () => {
    const onChange = vi.fn();
    render(<ColorPicker label="Color" value={[0, 0, 0]} onChange={onChange} />);
    // Get the text input (first one)
    const inputs = screen.getAllByDisplayValue('#000000');
    const textInput = inputs.find(i => i.getAttribute('type') === 'text');
    expect(textInput).toBeDefined();
    fireEvent.change(textInput!, { target: { value: '#FF0000' } });
    expect(onChange).toHaveBeenCalledWith([1, 0, 0]);
  });
});

describe('Select', () => {
  const options = [
    { value: 'plastic', label: 'Plastic' },
    { value: 'metal', label: 'Metal' },
    { value: 'glass', label: 'Glass' },
  ];

  it('displays label', () => {
    render(
      <Select label="Type" value="plastic" onChange={() => {}} options={options} />
    );
    expect(screen.getByText('Type')).toBeDefined();
  });

  it('displays all options', () => {
    render(
      <Select label="Type" value="plastic" onChange={() => {}} options={options} />
    );
    expect(screen.getByText('Plastic')).toBeDefined();
    expect(screen.getByText('Metal')).toBeDefined();
    expect(screen.getByText('Glass')).toBeDefined();
  });

  it('calls onChange with selected value', () => {
    const onChange = vi.fn();
    render(
      <Select label="Type" value="plastic" onChange={onChange} options={options} />
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'metal' } });
    expect(onChange).toHaveBeenCalledWith('metal');
  });
});

