import React from 'react';
import styles from './Button.module.css';
import type { ButtonProps } from '../../types/button';

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  loading = false,
  className 
}) => {
  const isDisabled = disabled || loading;
  
  return (
    <button
      className={`${styles.btn} ${styles[`btn--${variant}`]} ${styles[`btn--${size}`]} ${className || ''}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
};

export default Button;
