'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import styles from './BrandStory.module.css';
import ShopButton from './ShopButton';

const RevealWord = ({ word, progress, start, end }: { word: string, progress: any, start: number, end: number }) => {
  const color = useTransform(progress, [start, end], ["#b0b0b0", "#111111"]);
  return <motion.span style={{ color, display: 'inline-block', marginRight: '0.25em' }}>{word}</motion.span>;
};

const ScrollRevealHeading = ({ text, className, id }: { text: string, className?: string, id?: string }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 45%"] });
  // Split on <br/> tokens as well so we can insert real line breaks
  const tokens = text.split(/(<br\/>)/);
  
  let wordCount = 0;
  tokens.forEach(t => {
    if (t !== '<br/>') wordCount += t.split(' ').length;
  });

  let currentWord = 0;

  return (
    <h2 ref={ref} id={id} className={className}>
      <span className={styles.srOnly}>{text.replace(/<br\/>/g, ' ')}</span>
      <span aria-hidden="true">
        {tokens.map((token, i) => {
          if (token === '<br/>') return <br key={i} />;
          const words = token.split(' ');
          return words.map((word, j) => {
            const start = currentWord / wordCount;
            const end = (currentWord + 1) / wordCount;
            currentWord++;
            return <RevealWord key={`${i}-${j}`} word={word} progress={scrollYProgress} start={start} end={end} />;
          });
        })}
      </span>
    </h2>
  );
};

export default function BrandStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const { scrollYProgress: enterProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80%", "center 40%"]
  });

  const getVal = (desktop: number, mobile: number) => {
    if (prefersReducedMotion) return 0;
    return isMobile ? mobile : desktop;
  };

  const getRotate = (desktop: string, mobile: string) => {
    if (prefersReducedMotion) return desktop;
    return isMobile ? mobile : desktop;
  };

  // Collage scroll animations
  const leftX = useTransform(enterProgress, [0, 1], [getVal(60, 20), 0]);
  const leftY = useTransform(enterProgress, [0, 1], [getVal(100, 40), 0]);
  const leftRotate = useTransform(enterProgress, [0, 1], ["0deg", getRotate("-6deg", "-6deg")]);

  const rightX = useTransform(enterProgress, [0, 1], [getVal(-60, -20), 0]);
  const rightY = useTransform(enterProgress, [0, 1], [getVal(100, 40), 0]);
  const rightRotate = useTransform(enterProgress, [0, 1], ["0deg", getRotate("8deg", "8deg")]);

  const centerY = useTransform(enterProgress, [0, 1], [getVal(50, 20), 0]);

  // Badges scroll animations (inward toward center)
  // Badge 1: Desktop TL, Mobile TL (moves down and right from top beside heading)
  const badge1X = useTransform(enterProgress, [0, 1], [0, getVal(60, 10)]);
  const badge1Y = useTransform(enterProgress, [0, 1], [0, getVal(60, 10)]);

  // Badge 2: Desktop BL (up & right), Mobile TR (down & left)
  const badge2X = useTransform(enterProgress, [0, 1], [0, getVal(60, -10)]);
  const badge2Y = useTransform(enterProgress, [0, 1], [0, getVal(-60, 10)]);

  // Badge 3: Desktop TR (down & left from top beside heading), Mobile BL (up & right)
  const badge3X = useTransform(enterProgress, [0, 1], [0, getVal(-60, 10)]);
  const badge3Y = useTransform(enterProgress, [0, 1], [0, getVal(60, -10)]);

  // Badge 4: Desktop BR, Mobile BR (up & left)
  const badge4X = useTransform(enterProgress, [0, 1], [0, getVal(-60, -10)]);
  const badge4Y = useTransform(enterProgress, [0, 1], [0, getVal(-60, -10)]);

  return (
    <section id="brand-story" ref={sectionRef} className={styles.brandStorySection} aria-labelledby="brand-story-heading">
      <div className={styles.container}>
        <div className={styles.textContent}>
          <span className={styles.eyebrow}>THE DOWNFALL STORY</span>
          <ScrollRevealHeading text="Made for Every Version of You." id="brand-story-heading" className={styles.heading} />
          <p className={styles.body}>
            Everyday essentials. Sharp formal pieces. Statement looks. DOWNFALL brings them together so you can dress for the moment—and make it your own.
          </p>
          <ShopButton text="EXPLORE DOWNFALL" href="/collections/all" />
        </div>

        <div className={styles.collageContainer}>
          <div className={styles.collageWrapper}>
            <div className={`${styles.imageLayout} ${styles.imageLeft}`}>
              <motion.div style={{ x: leftX, y: leftY, width: '100%', height: '100%' }}>
                <div className={styles.imageHoverWrapper}>
                  <motion.div className={styles.imageRotation} style={{ rotate: leftRotate }}>
                    <Image src="/shop_basics.jpg" alt="Everyday essentials" fill sizes="(max-width: 1023px) 50vw, 30vw" className={styles.image} />
                  </motion.div>
                </div>
              </motion.div>
            </div>
            <div className={`${styles.imageLayout} ${styles.imageCenter}`}>
              <motion.div style={{ y: centerY, width: '100%', height: '100%' }}>
                <div className={styles.imageHoverWrapper}>
                  <motion.div className={styles.imageRotation} style={{ rotate: "0deg" }}>
                    <Image src="/editorial_streetwear.jpg" alt="Statement looks" fill sizes="(max-width: 1023px) 60vw, 40vw" className={styles.image} priority />
                  </motion.div>
                </div>
              </motion.div>
            </div>
            <div className={`${styles.imageLayout} ${styles.imageRight}`}>
              <motion.div style={{ x: rightX, y: rightY, width: '100%', height: '100%' }}>
                <div className={styles.imageHoverWrapper}>
                  <motion.div className={styles.imageRotation} style={{ rotate: rightRotate }}>
                    <Image src="/shop_formal.jpg" alt="Sharp formal pieces" fill sizes="(max-width: 1023px) 50vw, 30vw" className={styles.image} />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className={styles.badgesWrapper}>
            <div className={`${styles.badgeLayout} ${styles.badge1}`}>
              <motion.div style={{ x: badge1X, y: badge1Y, width: '100%', height: '100%' }}>
                <div className={styles.badgeInner}>
                  <svg className={styles.badgeSvg} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M 40,30 C 30,10 60,-10 80,10 C 100,-5 140,-5 150,15 C 180,5 200,30 180,50 C 210,80 180,110 160,100 C 140,125 90,125 70,105 C 40,130 0,110 20,80 C -10,60 10,20 40,30 Z" stroke="#111111" strokeWidth="2.5" fill="var(--bg-offwhite)" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.badgeText}>Everyday Essentials</span>
                </div>
              </motion.div>
            </div>
            <div className={`${styles.badgeLayout} ${styles.badge2}`}>
              <motion.div style={{ x: badge2X, y: badge2Y, width: '100%', height: '100%' }}>
                <div className={styles.badgeInner}>
                  <svg className={styles.badgeSvg} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M 40,30 C 30,10 60,-10 80,10 C 100,-5 140,-5 150,15 C 180,5 200,30 180,50 C 210,80 180,110 160,100 C 140,125 90,125 70,105 C 40,130 0,110 20,80 C -10,60 10,20 40,30 Z" stroke="#111111" strokeWidth="2.5" fill="var(--bg-offwhite)" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.badgeText}>Sharp Formal Pieces</span>
                </div>
              </motion.div>
            </div>
            <div className={`${styles.badgeLayout} ${styles.badge3}`}>
              <motion.div style={{ x: badge3X, y: badge3Y, width: '100%', height: '100%' }}>
                <div className={styles.badgeInner}>
                  <svg className={styles.badgeSvg} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M 40,30 C 30,10 60,-10 80,10 C 100,-5 140,-5 150,15 C 180,5 200,30 180,50 C 210,80 180,110 160,100 C 140,125 90,125 70,105 C 40,130 0,110 20,80 C -10,60 10,20 40,30 Z" stroke="#111111" strokeWidth="2.5" fill="var(--bg-offwhite)" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.badgeText}>Statement Looks</span>
                </div>
              </motion.div>
            </div>
            <div className={`${styles.badgeLayout} ${styles.badge4}`}>
              <motion.div style={{ x: badge4X, y: badge4Y, width: '100%', height: '100%' }}>
                <div className={styles.badgeInner}>
                  <svg className={styles.badgeSvg} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M 40,30 C 30,10 60,-10 80,10 C 100,-5 140,-5 150,15 C 180,5 200,30 180,50 C 210,80 180,110 160,100 C 140,125 90,125 70,105 C 40,130 0,110 20,80 C -10,60 10,20 40,30 Z" stroke="#111111" strokeWidth="2.5" fill="var(--bg-offwhite)" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.badgeText}>One Wardrobe.<br/>Every Moment.</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
