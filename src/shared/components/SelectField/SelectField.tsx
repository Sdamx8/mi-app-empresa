import React from 'react';
import { Controller } from 'react-hook-form';
import styles from './SelectField.module.css';

interface SelectFieldProps {
  name: string;
  control: any;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  control,
  label,
  options,
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  className,
}) => {
  return (
    <div className={`${styles.selectField} ${className || ''}`}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className={styles.selectGroup}>
            {label && (
              <label className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
              </label>
            )}
            <select
              {...field}
              className={`${styles.select} ${fieldState.error ? styles.error : ''}`}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldState.error && (
              <span className={styles.errorMessage}>{fieldState.error.message}</span>
            )}
          </div>
        )}
      />
    </div>
  );
};