// src/components/ui/Input.tsx
import { type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-md border bg-[#111] px-3 py-2 text-sm text-neutral-200 
          file:border-0 file:bg-transparent file:text-sm file:font-medium 
          placeholder:text-neutral-500 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          transition-colors duration-200
          ${error ? 'border-red-500 focus-visible:ring-red-500' : 'border-neutral-800'}
          ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';