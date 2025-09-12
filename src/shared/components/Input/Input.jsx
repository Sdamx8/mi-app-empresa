import React from 'react';
import styles from './Input.module.css';

export default function Input({ label, error, ...props }) {
  return (
    <div className={styles.inputGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={styles.input} aria-invalid={!!error} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
