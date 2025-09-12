import React from 'react';
import { Controller } from 'react-hook-form';
import Input from '../Input/Input';
import styles from './FormField.module.css';

interface FormFieldProps {
  name: string;
  control: any;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  control,
  label,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className,
}) => {
  return (
    <div className={`${styles.formField} ${className || ''}`}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            type={type}
            label={label}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            error={fieldState.error?.message}
            className={styles.input}
          />
        )}
      />
    </div>
  );
};