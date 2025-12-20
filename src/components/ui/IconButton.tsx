import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible label (required for icon-only controls) */
  'aria-label': string;
  /** Optional tooltip */
  title?: string;
  /** Icon element (typically a lucide-react icon) */
  icon: React.ReactNode;
  /** Visual variant */
  variant?: 'default' | 'ghost';
  /** Size preset */
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      className = '',
      variant = 'default',
      size = 'md',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const base =
      `
        inline-flex items-center justify-center select-none
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
      `.trim();

    const sizes: Record<NonNullable<IconButtonProps['size']>, string> = {
      sm: 'w-8 h-8 rounded-md',
      md: 'w-9 h-9 rounded-lg',
    };

    const variants: Record<NonNullable<IconButtonProps['variant']>, string> = {
      default:
        'bg-elevated hover:bg-hover text-text-secondary border border-border-default',
      ghost: 'hover:bg-hover text-text-secondary',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';


