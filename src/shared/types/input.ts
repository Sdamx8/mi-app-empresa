import { HTMLInputTypeAttribute } from 'react';

export interface InputProps {
  label?: string;
  error?: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}