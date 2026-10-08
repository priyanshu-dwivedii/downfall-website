import Image from 'next/image';
import AnimatedHeading from './AnimatedHeading';
import styles from './InstagramSection.module.css';

interface InstagramPost {
  id: string;
  image: string;
  altText: string;
  postUrl?: string;
  isReel?: boolean;
}

// Configurable account details
const INSTAGRAM_HANDLE: string | null = null; // Awaiting client approval (e.g., "@downfall")
const INSTAGRAM_PROFILE_URL: string | null = null; // Awaiting real profile URL
const INSTAGRAM_POSTS_COUNT: string | null = null; // Awaiting stats (e.g., "142")
const INSTAGRAM_FOLLOWERS_COUNT: string | null = null; // Awaiting stats (e.g., "10.5K")

// Demo data
const demoPosts: InstagramPost[] = [
  { id: 'post-1', image: '/shop_basics.jpg', altText: 'Demo post featuring everyday streetwear' },
  { id: 'post-2', image: '/shop_formal.jpg', altText: 'Demo post featuring formal wear' },
  { id: 'post-3', image: '/garment_2.jpg', altText: 'Demo post featuring a premium grey hoodie' },
  { id: 'post-4', image: '/garment_4.jpg', altText: 'Demo post featuring minimalist white sneakers' },
  { id: 'post-5', image: '/figure1.png', altText: 'Demo post featuring everyday model' },
  { id: 'post-6', image: '/figure2.png', altText: 'Demo post featuring office model' },
];

export default function InstagramSection() {
  const HeaderWrapper = INSTAGRAM_PROFILE_URL ? 'a' : 'div';
  const headerWrapperProps = INSTAGRAM_PROFILE_URL 
    ? { href: INSTAGRAM_PROFILE_URL, target: '_blank', rel: 'noopener noreferrer', className: styles.headerLink }
    : { className: styles.headerNonLink };

  const IconWrapper = INSTAGRAM_PROFILE_URL ? 'a' : 'div';
  const iconWrapperProps = INSTAGRAM_PROFILE_URL 
    ? { href: INSTAGRAM_PROFILE_URL, target: '_blank', rel: 'noopener noreferrer', className: styles.iconLink, 'aria-label': 'Visit Instagram Profile' }
    : { className: styles.iconNonLink, 'aria-hidden': true };

  return (
    <section id="instagram" className={styles.instagramSection} aria-labelledby="instagram-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <AnimatedHeading text="Downfall on Instagram" as="h2" id="instagram-heading" className={styles.sectionHeading} />

        </div>

        <div className={styles.panel}>
          {/* Profile Header */}
          <div className={styles.panelHeader}>
            <HeaderWrapper {...headerWrapperProps}>
              <div className={styles.avatarContainer}>
                <div className={styles.gradientRing}>
                  <div className={styles.avatarInner}>
                    <Image 
                      src="/Downfall%20logo.png" 
                      alt="Downfall Avatar" 
                      width={48} 
                      height={48} 
                      className={styles.avatarImage} 
                    />
                  </div>
                </div>
              </div>
              
              <div className={styles.profileInfo}>
                <h3 className={styles.handle}>
                  {INSTAGRAM_HANDLE || 'Instagram handle pending'}
                </h3>
                <div className={styles.displayName}>DOWNFALL</div>
                
                {INSTAGRAM_HANDLE && INSTAGRAM_POSTS_COUNT && INSTAGRAM_FOLLOWERS_COUNT && (
                  <div className={styles.stats}>
                    <span><strong>{INSTAGRAM_POSTS_COUNT}</strong> posts</span>
                    <span><strong>{INSTAGRAM_FOLLOWERS_COUNT}</strong> followers</span>
                  </div>
                )}
              </div>
            </HeaderWrapper>

            <IconWrapper {...iconWrapperProps}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.instagramIcon}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </IconWrapper>
          </div>

          {/* Posts Grid */}
          <div className={styles.grid}>
            {demoPosts.map((post) => {
              const content = (
                <div className={styles.imageWrapper}>
                  <Image
                    src={post.image}
                    alt={post.altText}
                    fill
                    sizes="(max-width: 768px) 33vw, 300px"
                    className={styles.image}
                    loading="lazy"
                  />
                  {post.isReel && (
                    <div className={styles.reelIcon}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              );

              if (post.postUrl) {
                return (
                  <a 
                    key={post.id} 
                    href={post.postUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.postCardLink}
                    aria-label={`View post on Instagram: ${post.altText}`}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div key={post.id} className={styles.postCard}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
