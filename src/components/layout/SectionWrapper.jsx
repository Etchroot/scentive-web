import styles from './SectionWrapper.module.css';

/**
 * SectionWrapper
 * bgType: 'warm' | 'neutral' | 'impact' | 'white'
 */
export default function SectionWrapper({ bgType = 'neutral', children, className = '', id, style }) {
  return (
    <section
      id={id}
      className={`${styles.wrapper} ${styles[bgType]} ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}
