'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AnimatedHeading.module.css';

interface HeroTitlesProps {
  titleText: string;
  taglineText: string;
  titleClassName: string;
  taglineClassName: string;
}

export default function HeroTitles({ titleText, taglineText, titleClassName, taglineClassName }: HeroTitlesProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLHeadingElement>(null);

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

  const titleWords = titleText.split(' ');
  let titleLetterIndex = 0;
  const titleLetterCount = titleText.replace(/ /g, '').length;

  const taglineWords = taglineText.split(' ');
  let taglineLetterIndex = 0;
  const taglineLetterCount = taglineText.replace(/ /g, '').length;

  // Stagger window is determined by the title (45ms per letter)
  const totalStaggerWindow = (titleLetterCount - 1) * 0.045;
  // Calculate the stagger for the tagline so it finishes at exactly the same time
  const taglineStagger = taglineLetterCount > 1 ? totalStaggerWindow / (taglineLetterCount - 1) : 0;

  return (
    <>
      <h1 ref={ref} className={`${styles.animatedHeading} ${titleClassName} ${isVisible ? styles.visible : ''}`} aria-label={titleText}>
        <span className={styles.srOnly}>{titleText}</span>
        <span aria-hidden="true" className={styles.wordsWrapper}>
          {titleWords.map((word, wordIdx) => (
            <span key={wordIdx} className={styles.word}>
              {word.split('').map((char, charIdx) => {
                const currentDelay = titleLetterIndex * 0.045;
                titleLetterIndex++;
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
              {wordIdx !== titleWords.length - 1 && <span className={styles.space}>&nbsp;</span>}
            </span>
          ))}
        </span>
      </h1>

      <p className={`${styles.animatedHeading} ${taglineClassName} ${isVisible ? styles.visible : ''}`} aria-label={taglineText}>
        <span className={styles.srOnly}>{taglineText}</span>
        <span aria-hidden="true" className={styles.wordsWrapper}>
          {taglineWords.map((word, wordIdx) => (
            <span key={wordIdx} className={styles.word}>
              {word.split('').map((char, charIdx) => {
                const currentDelay = taglineLetterIndex * taglineStagger;
                taglineLetterIndex++;
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
              {wordIdx !== taglineWords.length - 1 && <span className={styles.space}>&nbsp;</span>}
            </span>
          ))}
        </span>
      </p>
    </>
  );
}
