import Image from 'next/image';
import Link from 'next/link';
import NewsletterForm from './NewsletterForm';
import styles from './Footer.module.css';

const features = [
  {
    title: 'EVERYDAY ESSENTIALS',
    text: 'Explore Basics',
    href: '/collections/basics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
        <line x1="16" y1="8" x2="2" y2="22"></line>
        <line x1="17.5" y1="15" x2="9" y2="6.5"></line>
      </svg>
    ),
  },
  {
    title: 'FORMAL PICKS',
    text: 'Explore Formal',
    href: '/collections/formal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
  },
  {
    title: 'STATEMENT STYLES',
    text: 'Explore Luxury',
    href: '/collections/luxury',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ),
  },
  {
    title: 'DISCOVER DOWNFALL',
    text: 'Read our story',
    href: '/#brand-story',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        
        {/* Feature Strip */}
        <div className={styles.featureStrip}>
          {features.map((feature, idx) => (
            <Link key={idx} href={feature.href} className={styles.featureItem}>
              <div className={styles.featureIconWrap}>
                {feature.icon}
              </div>
              <div className={styles.featureTextWrap}>
                <h4 className={styles.featureTitle}>{feature.title}</h4>
                <p className={styles.featureText}>{feature.text}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Columns */}
        <div className={styles.columnsWrapper}>
          
          <div className={styles.brandColumn}>
            <Image 
              src="/downfall-white-red-transparent.png" 
              alt="Downfall Logo" 
              width={166} 
              height={90} 
              style={{ objectFit: 'contain' }}
              className={styles.logo}
            />
            <p className={styles.brandText}>
              The only downfall you’ll enjoy!
            </p>
          </div>

          <div className={styles.navGroup}>
            <div className={styles.navColumn}>
              <h3 className={styles.heading}>LINKS</h3>
              <ul className={styles.linkList}>
                <li><Link href="/#home" className={styles.link}>Home</Link></li>
                <li><Link href="/#bestsellers" className={styles.link}>Bestsellers</Link></li>
                <li><Link href="/#collections" className={styles.link}>Collections</Link></li>
                <li><Link href="/#brand-story" className={styles.link}>The Story</Link></li>
              </ul>
            </div>

            <div className={styles.navColumn}>
              <h3 className={styles.heading}>COLLECTIONS</h3>
              <ul className={styles.linkList}>
                <li><Link href="/collections/basics" className={styles.link}>Basics</Link></li>
                <li><Link href="/collections/formal" className={styles.link}>Formal</Link></li>
                <li><Link href="/collections/luxury" className={styles.link}>Luxury</Link></li>
              </ul>
            </div>

            <div className={styles.navColumn}>
              <h3 className={styles.heading}>CUSTOMER CARE</h3>
              <ul className={styles.linkList}>
                <li><span className={styles.disabledLink}>Contact Us</span></li>
                <li><span className={styles.disabledLink}>Help & FAQ</span></li>
                <li><span className={styles.disabledLink}>Track Your Order</span></li>
              </ul>
            </div>
          </div>

          <div className={styles.navGroupPolicies}>
            <div className={styles.navColumn}>
              <h3 className={styles.heading}>POLICIES</h3>
              <ul className={styles.linkList}>
                <li><span className={styles.disabledLink}>Privacy Policy</span></li>
                <li><span className={styles.disabledLink}>Terms of Service</span></li>
                <li><span className={styles.disabledLink}>Return Policy</span></li>
              </ul>
            </div>

            <div className={styles.navColumnNewsletter}>
              <h3 className={styles.heading}>STAY UPDATED</h3>
              <p className={styles.newsletterText}>Get the latest releases and exclusive offers.</p>
              <NewsletterForm />
              <div className={styles.socialIcons}>
                <span className={styles.socialIcon} aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </span>
                <span className={styles.socialIcon} aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p>© {currentYear} DOWNFALL. ALL RIGHTS RESERVED.</p>
        </div>

      </div>
    </footer>
  );
}
