import styles from './AnnouncementStrip.module.css';

export default function AnnouncementStrip() {
  const message = "WELCOME TO DOWNFALL";
  
  // Repeated content to fill horizontal space
  const repeatCount = 6;
  const contentGroup = Array(repeatCount).fill(message).map((msg, i) => (
    <span key={i} className={styles.messageItem} aria-hidden={i > 0 ? "true" : undefined}>
      {msg}
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
          {Array(repeatCount).fill(message).map((msg, i) => (
            <span key={`dup-${i}`} className={styles.messageItem}>
              {msg}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
