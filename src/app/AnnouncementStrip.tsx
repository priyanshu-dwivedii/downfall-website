import React from 'react';
import styles from './AnnouncementStrip.module.css';

interface AnnouncementStripProps {
  messages?: string[];
}

export default function AnnouncementStrip({ messages = ["WELCOME TO DOWNFALL"] }: AnnouncementStripProps) {
  // Repeated content to fill horizontal space securely
  const repeatCount = 6;
  
  // Combine all messages with the ✳ separator
  const combinedElements = messages.map((msg, index) => (
    <React.Fragment key={index}>
      <span>{msg}</span>
      <span className={styles.separator} aria-hidden="true">✳</span>
    </React.Fragment>
  ));

  const contentGroup = Array(repeatCount).fill(0).map((_, i) => (
    <span key={i} className={styles.messageItem} aria-hidden={i > 0 ? "true" : undefined}>
      {combinedElements}
    </span>
  ));

  return (
    <section 
      className={styles.stripContainer} 
      aria-label="Announcement"
      tabIndex={0}
    >
      <div className={styles.marquee}>
        <div className={styles.marqueeContent}>
          {contentGroup}
        </div>
        <div className={styles.marqueeContent} aria-hidden="true">
          {Array(repeatCount).fill(0).map((_, i) => (
            <span key={`dup-${i}`} className={styles.messageItem}>
              {combinedElements}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
