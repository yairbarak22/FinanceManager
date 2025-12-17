// TypeScript declarations for Google Analytics gtag.js

interface GtagConfig {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  send_page_view?: boolean;
  [key: string]: unknown;
}

interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
}

type GtagCommand = 'config' | 'set' | 'event' | 'consent';

interface Window {
  gtag: (
    command: GtagCommand,
    targetId: string,
    config?: GtagConfig | GtagEventParams | Record<string, unknown>
  ) => void;
  dataLayer: unknown[];
}

declare global {
  interface Window {
    gtag: (
      command: GtagCommand,
      targetId: string,
      config?: GtagConfig | GtagEventParams | Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

export {};

