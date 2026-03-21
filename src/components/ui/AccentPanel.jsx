import styles from './AccentPanel.module.css';

export default function AccentPanel({ children, className = '' }) {
  return (
    <div className={`${styles.panel} ${className}`}>
      {children}
    </div>
  );
}
