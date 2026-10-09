'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

const RevealWord = ({ word, progress, start, end }: { word: string, progress: any, start: number, end: number }) => {
  const color = useTransform(progress, [start, end], ["#b0b0b0", "#111111"]);
  return <motion.span style={{ color, display: 'inline-block', marginRight: '0.25em' }}>{word}</motion.span>;
};

interface ScrollAnimatedHeadingProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  className?: string;
  id?: string;
}

export default function ScrollAnimatedHeading({ text, as: Component = 'h2', className = '', id }: ScrollAnimatedHeadingProps) {
  const ref = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 45%"] });
  
  if (shouldReduceMotion) {
    return <Component id={id} className={className} style={{ color: '#111111' }}>{text}</Component>;
  }

  const words = text.split(' ');
  const wordCount = words.length;

  return (
    <Component ref={ref as any} id={id} className={className}>
      <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => {
          const start = i / wordCount;
          const end = (i + 1) / wordCount;
          return <RevealWord key={i} word={word} progress={scrollYProgress} start={start} end={end} />;
        })}
      </span>
    </Component>
  );
}
