import React from 'react';
import styles from './Input.module.css';
import type { InputProps } from '../../types/input';

const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className={`${styles.inputGroup} ${className || ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={styles.input} aria-invalid={!!error} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export default Input;