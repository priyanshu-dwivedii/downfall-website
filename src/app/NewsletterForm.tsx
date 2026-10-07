"use client";

import styles from './Footer.module.css';

export default function NewsletterForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form className={styles.newsletterForm} onSubmit={handleSubmit}>
      <label htmlFor="newsletter-email" className={styles['sr-only'] || "sr-only"}>Email address</label>
      <input 
        id="newsletter-email"
        type="email" 
        placeholder="Enter your email" 
        className={styles.newsletterInput}
        required
        disabled
      />
      <button 
        type="submit" 
        className={styles.newsletterSubmit} 
        aria-label="Subscribe"
        disabled
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </form>
  );
}
