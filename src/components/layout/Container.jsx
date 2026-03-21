import styles from './Container.module.css';

export default function Container({ children, className = '', style }) {
  return (
    <div className={`${styles.container} ${className}`} style={style}>
      {children}
    </div>
  );
}
