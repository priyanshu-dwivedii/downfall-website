import Image from 'next/image';
import styles from './BrandStory.module.css';

export default function BrandStory() {
  return (
    <section id="brand-story" className={styles.brandStorySection} aria-labelledby="brand-story-heading">
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.textColumn}>
            {/* AWAITING CLIENT APPROVAL */}
            <span className={styles.eyebrow}>THE BRAND</span>
            <h2 id="brand-story-heading" className={styles.heading}>THIS IS DOWNFALL.</h2>
            <p className={styles.body}>
              “A sharper take on everyday streetwear. DOWNFALL brings bold expression to the pieces you reach for—from daily essentials to statement looks.”
            </p>
          </div>
          <div className={styles.imageColumn}>
            <div className={styles.imageWrapper}>
              <Image 
                src="/editorial_streetwear.jpg" 
                alt="Editorial streetwear featuring a distinct look" 
                fill 
                sizes="(max-width: 1023px) 100vw, 50vw"
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
