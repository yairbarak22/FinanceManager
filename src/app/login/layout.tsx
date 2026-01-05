import { Metadata } from 'next';
import {
  JsonLd,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
  createSchemaGraph,
} from '@/components/seo/JsonLd';

/**
 * Login Page Metadata
 * This is a public page that should be indexed by search engines.
 */
export const metadata: Metadata = {
  title: 'התחברות',
  description: 'התחבר לחשבון NETO שלך והתחל לנהל את הכספים שלך בחוכמה. ניהול הוצאות, השקעות ותכנון פיננסי - בחינם.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'התחברות | NETO',
    description: 'התחבר לחשבון NETO שלך וצמח כלכלית',
    type: 'website',
    url: '/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create combined schema graph for the login page
  const schemaData = createSchemaGraph(
    organizationSchema,
    softwareApplicationSchema,
    websiteSchema
  );

  return (
    <>
      <JsonLd data={schemaData} />
      {children}
    </>
  );
}
