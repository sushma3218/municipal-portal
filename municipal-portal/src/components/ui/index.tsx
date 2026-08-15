import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-gray-200 focus:ring-gray-300",
    outline: "border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white focus:ring-[var(--primary)]",
    destructive: "bg-[var(--destructive)] text-white hover:bg-red-600 focus:ring-red-500",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`border border-[var(--border)] rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white text-black ${className}`}
      {...props}
    />
  );
}

export function Label({ className = '', children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block font-medium mb-1 text-sm ${className}`} {...props}>
      {children}
    </label>
  );
}
