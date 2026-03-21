import styles from './Divider.module.css';

/**
 * Divider
 * variant: 'strong' | 'default' | 'light'
 * direction: 'horizontal' | 'vertical'
 */
export default function Divider({ variant = 'default', direction = 'horizontal', className = '', style }) {
  return (
    <hr
      className={`${styles.divider} ${styles[variant]} ${styles[direction]} ${className}`}
      style={style}
    />
  );
}
