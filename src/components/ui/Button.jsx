import styles from './Button.module.css';

/**
 * Button
 * variant: 'primary' | 'outline' | 'ghost'
 */
export default function Button({
  variant = 'primary',
  children,
  href,
  onClick,
  className = '',
  target,
  rel,
}) {
  const cls = `${styles.btn} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={cls} target={target} rel={rel}>
        {children}
      </a>
    );
  }

  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
