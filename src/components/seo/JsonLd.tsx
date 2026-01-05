/**
 * JSON-LD Structured Data Component
 *
 * Renders schema.org structured data for SEO.
 * Used for Organization, SoftwareApplication, Article, FAQ schemas.
 *
 * @see https://schema.org
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
}

// Pre-defined schemas for NETO

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://neto.co.il';

/**
 * Organization Schema - Used on all pages
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: 'NETO',
  url: BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/logo.svg`,
    width: 200,
    height: 60,
  },
  description: 'ניהול הון חכם - המקום שלך לצמוח כלכלית',
  sameAs: [
    // Add social media URLs when available
    // 'https://www.facebook.com/neto',
    // 'https://www.linkedin.com/company/neto',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@neto.co.il',
    contactType: 'customer support',
    availableLanguage: ['Hebrew', 'English'],
  },
};

/**
 * SoftwareApplication Schema - For the NETO app
 */
export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'NETO',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description: 'ניהול הוצאות, השקעות ותכנון פיננסי חכם',
  url: BASE_URL,
  author: {
    '@type': 'Organization',
    name: 'NETO',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'ILS',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'מעקב הוצאות אוטומטי',
    'ניהול תיק השקעות',
    'תכנון תקציב חודשי',
    'ייבוא עסקאות מהבנק',
    'גרפים ודוחות',
  ],
};

/**
 * WebSite Schema - For search box and site info
 */
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  name: 'NETO',
  url: BASE_URL,
  description: 'ניהול הון חכם',
  inLanguage: 'he-IL',
  publisher: {
    '@id': `${BASE_URL}/#organization`,
  },
};

/**
 * Combine multiple schemas into one graph
 */
export function createSchemaGraph(...schemas: Record<string, unknown>[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas.map((schema) => {
      // Remove @context from individual schemas when combining
      const { '@context': _, ...rest } = schema;
      return rest;
    }),
  };
}

export default JsonLd;
