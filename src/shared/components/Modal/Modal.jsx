import React from 'react';
import styles from './Modal.module.css';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} aria-label="Cerrar modal">×</button>
        {children}
      </div>
    </div>
  );
}
