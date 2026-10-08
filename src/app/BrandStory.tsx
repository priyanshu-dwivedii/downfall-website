import Image from 'next/image';
import Link from 'next/link';
import AnimatedHeading from './AnimatedHeading';
import styles from './BrandStory.module.css';

export default function BrandStory() {
  return (
    <section id="brand-story" className={styles.brandStorySection} aria-labelledby="brand-story-heading">
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.textColumn}>
            <span className={styles.eyebrow}>THE BRAND</span>
            <AnimatedHeading text="Wear Your Own Story." as="h2" id="brand-story-heading" className={styles.heading} />
            <div className={styles.body}>
              <p>Style is personal. Your wardrobe should be too.</p>
              <p>DOWNFALL brings everyday essentials, sharp formal pieces, and statement looks together—so you can dress for the moment and make it your own.</p>
            </div>
            
            <hr className={styles.divider} aria-hidden="true" />
            <span className={styles.smallStatement}>ONE WARDROBE. EVERY MOMENT.</span>
            
            <Link href="/#collections" className={styles.exploreLink}>
              EXPLORE THE COLLECTION ↗
            </Link>
          </div>
          <div className={styles.imageColumn}>
            <div className={styles.imageWrapper}>
              <Image 
                src="/editorial_streetwear.jpg" 
                alt="Editorial streetwear featuring a distinct look" 
                fill 
                sizes="(max-width: 1023px) 100vw, 55vw"
                className={styles.image}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
