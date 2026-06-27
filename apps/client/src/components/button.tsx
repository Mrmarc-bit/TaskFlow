import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const variantStyles = {
    primary: 'bg-linear-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/20 hover:brightness-105 glow-on-hover',
    secondary: 'bg-linear-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/20 hover:brightness-105',
    danger: 'bg-linear-to-r from-danger-accent to-rose-600 text-white shadow-md shadow-danger-accent/10 hover:shadow-lg hover:shadow-danger-accent/20 hover:brightness-105',
    ghost: 'hover:bg-slate-500/10 text-slate-700 dark:text-slate-300',
    glass: 'glass-panel hover:bg-slate-500/15 text-slate-800 dark:text-slate-100',
  };

  // Convert props to fit motion button types
  const motionProps = props as any;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
};
