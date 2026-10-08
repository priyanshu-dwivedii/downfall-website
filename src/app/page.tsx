import styles from './page.module.css';
import Image from 'next/image';
import ShopButton from './ShopButton';
import Bestsellers from './Bestsellers';
import AnnouncementStrip from './AnnouncementStrip';
import ProductListing from './ProductListing';
import BrandStory from './BrandStory';
import InstagramSection from './InstagramSection';
import HeroNav from './HeroNav';
import HeroTitles from './HeroTitles';

export default function Home() {
  return (
    <main>
      <AnnouncementStrip messages={[
        'EVERYDAY STREETWEAR',
        'BOLD EXPRESSION',
        'DAILY ESSENTIALS',
        'STATEMENT LOOKS'
      ]} />
      <header id="home" className={styles.heroContainer}>
        <section className={styles.heroSceneSection}>
          {/* Full-width Background Layers */}
          <div className={styles.backgroundContainer}>
            {/* Architectural Background */}
            <div className={styles.wall}>
              <div className={styles.lighting}></div>
            </div>
            <div className={styles.lowerSceneShift}>
              <div className={styles.floor}>
                <div className={styles.floorReflection}></div>
              </div>
            </div>
          </div>

          <div className={styles.aspectRatioWrapper}>
            <div className={styles.scene}>

              {/* Top Header */}
              <HeroNav />

              {/* Typography Group */}
              <div className={styles.typographyGroup}>
                {/* Center Emblem */}
                <div className={styles.centerEmblem}>
                  <Image
                    src="/Downfall%20logo.png"
                    alt="Downfall Emblem"
                    width={40}
                    height={40}
                    className={styles.emblemImage}
                  />
                </div>

                {/* Titles */}
                <HeroTitles 
                  titleText="DOWNFALL"
                  taglineText="The only downfall you’ll enjoy!"
                  titleClassName={styles.mainTitle}
                  taglineClassName={styles.tagline}
                />
              </div>

              <div className={styles.lowerSceneShift}>
                {/* Figure Placements */}
                <div className={`${styles.figure} ${styles.fig1}`}>
                  <Image src="/figure1.png" alt="Everyday Model" fill className={styles.figureImage} />
                </div>
                <div className={`${styles.figure} ${styles.fig2}`}>
                  <Image src="/figure2.png" alt="Office Model" fill className={styles.figureImage} />
                </div>
                <div className={`${styles.figure} ${styles.fig3}`}>
                  <Image src="/figure3.png" alt="Café Model" fill className={styles.figureImage} />
                </div>
                <div className={`${styles.figure} ${styles.fig4}`}>
                  <Image src="/figure4.png" alt="Journey Model" fill className={styles.figureImage} />
                </div>
                <div className={`${styles.figure} ${styles.fig5}`}>
                  <Image src="/figure5.png" alt="Night Model" fill className={styles.figureImage} />
                </div>
                <div className={`${styles.figure} ${styles.fig6}`}>
                  <Image src="/figure6.png" alt="Escape Model" fill className={styles.figureImage} />
                </div>

                {/* Category Labels */}
                <div className={styles.categories}>
                  <span className={`${styles.categoryLabel} ${styles.lbl1}`}>EVERYDAY</span>
                  <span className={`${styles.categoryLabel} ${styles.lbl2}`}>OFFICE</span>
                  <span className={`${styles.categoryLabel} ${styles.lbl3}`}>CAFÉ</span>
                  <span className={`${styles.categoryLabel} ${styles.lbl4}`}>JOURNEY</span>
                  <span className={`${styles.categoryLabel} ${styles.lbl5}`}>NIGHT</span>
                  <span className={`${styles.categoryLabel} ${styles.lbl6}`}>ESCAPE</span>
                </div>

                {/* Bottom Strapline */}
                <div className={styles.bottomStrapline}>ONE WARDROBE. EVERY MOMENT.</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <ShopButton />
        </section>
      </header>

      <AnnouncementStrip messages={[
        'ONE WARDROBE. EVERY MOMENT.',
        'BASICS · FORMAL · LUXURY',
        'THIS IS DOWNFALL',
        'THE ONLY DOWNFALL YOU’LL ENJOY!'
      ]} />

      <Bestsellers />
      <ProductListing />
      <BrandStory />
      <InstagramSection />
    </main>
  );
}
