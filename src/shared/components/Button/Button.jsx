import React from 'react';
import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', size = 'md', onClick, disabled }) {
  return (
    <button
      className={`${styles.btn} ${styles[`btn--${variant}`]} ${styles[`btn--${size}`]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
