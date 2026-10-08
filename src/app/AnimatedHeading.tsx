'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AnimatedHeading.module.css';

interface AnimatedHeadingProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  className?: string;
  id?: string;
}

export default function AnimatedHeading({ text, as: Component = 'h2', className = '', id }: AnimatedHeadingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const words = text.split(' ');
  let letterIndex = 0;

  return (
    <Component 
      ref={ref as any}
      id={id}
      className={`${styles.animatedHeading} ${className} ${isVisible ? styles.visible : ''}`}
      aria-label={text}
    >
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true" className={styles.wordsWrapper}>
        {words.map((word, wordIdx) => (
          <span key={wordIdx} className={styles.word}>
            {word.split('').map((char, charIdx) => {
              const currentDelay = letterIndex * 0.045;
              letterIndex++;
              return (
                <span 
                  key={charIdx} 
                  className={styles.letter} 
                  style={{ '--delay': `${currentDelay}s` } as React.CSSProperties}
                >
                  {char}
                </span>
              );
            })}
            {wordIdx !== words.length - 1 && <span className={styles.space}>&nbsp;</span>}
          </span>
        ))}
      </span>
    </Component>
  );
}
