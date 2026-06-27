import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-xl border glass-panel transition-all duration-200 outline-none
            placeholder-slate-400 dark:placeholder-slate-500 text-sm
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10
            ${
              error
                ? 'border-danger-accent/50 focus:border-danger-accent focus:ring-danger-accent/10'
                : 'border-slate-500/10 dark:border-white/10'
            }
            ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-danger-accent font-medium mt-0.5 animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
