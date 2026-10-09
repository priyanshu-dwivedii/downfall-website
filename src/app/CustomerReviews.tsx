'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import styles from './CustomerReviews.module.css';

// Sample copy array
const REVIEWS = [
  {
    id: 1,
    name: "Customer Preview",
    text: "This piece seamlessly transitions into my everyday styling, adding an effortless edge to casual looks.",
    label: "Sample review — preview only"
  },
  {
    id: 2,
    name: "Customer Preview",
    text: "A structured fit that elevates my formal looks without feeling restrictive or overdone.",
    label: "Sample review — preview only"
  },
  {
    id: 3,
    name: "Customer Preview",
    text: "Perfect for building statement outfits. The design holds its own and anchors the entire look.",
    label: "Sample review — preview only"
  }
];

const RevealWord = ({ word, progress, start, end }: { word: string, progress: any, start: number, end: number }) => {
  const color = useTransform(progress, [start, end], ["#888888", "#ffffff"]);
  return <motion.span style={{ color, display: 'inline-block', marginRight: '0.25em' }}>{word}</motion.span>;
};

const ScrollRevealHeading = ({ text, className }: { text: string, className?: string }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 45%"] });
  
  if (shouldReduceMotion) {
    return <h2 className={className}>{text}</h2>;
  }

  const words = text.split(' ');
  const wordCount = words.length;

  return (
    <h2 ref={ref} className={className}>
      <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => {
          const start = i / wordCount;
          const end = (i + 1) / wordCount;
          return <RevealWord key={i} word={word} progress={scrollYProgress} start={start} end={end} />;
        })}
      </span>
    </h2>
  );
};

export default function CustomerReviews() {
  const shouldReduceMotion = useReducedMotion();

  const animationProps = shouldReduceMotion 
    ? { initial: { opacity: 1, y: 0 }, whileInView: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-10%" }
      };

  return (
    <section className={styles.reviewsSection}>
      <div className={styles.background}>
        <Image 
          src="/shop_basics.jpg" 
          alt="Customer reviews background" 
          fill 
          className={styles.backgroundImage}
          sizes="100vw"
        />
        <div className={styles.overlay} />
      </div>
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          {...animationProps}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <ScrollRevealHeading text="Don't take our word for it" className={styles.heading} />
          <p className={styles.subheading}>Your wardrobe. Your moments. Your DOWNFALL.</p>
        </motion.div>
        
        <div className={styles.cardsGrid}>
          {REVIEWS.map((review, i) => (
            <motion.div 
              key={review.id} 
              className={styles.reviewCard}
              {...animationProps}
              transition={{ duration: 0.6, ease: "easeOut", delay: shouldReduceMotion ? 0 : i * 0.15 }}
            >
              <div className={styles.cardHeader}>
                <span className={styles.sampleLabel}>{review.label}</span>
              </div>
              <p className={styles.reviewText}>"{review.text}"</p>
              <p className={styles.reviewerName}>— {review.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
