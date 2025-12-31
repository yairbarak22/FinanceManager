// TypeScript declarations for Smartlook behavior analytics

type SmartlookCommand =
  | 'init'
  | 'identify'
  | 'anonymize'
  | 'track'
  | 'record'
  | 'pause'
  | 'resume'
  | 'disable'
  | 'consentIP'
  | 'consentAPI'
  | 'getData'
  | 'restart'
  | 'error';

interface SmartlookInitOptions {
  region?: 'eu' | 'us';
  cookies?: boolean;
  advancedNetwork?: boolean;
  interceptors?: {
    network?: boolean;
    console?: boolean;
  };
}

interface SmartlookUserProperties {
  name?: string;
  email?: string;
  [key: string]: string | number | boolean | undefined;
}

interface SmartlookEventProperties {
  [key: string]: string | number | boolean | undefined;
}

interface SmartlookFunction {
  (command: 'init', projectKey: string, options?: SmartlookInitOptions): void;
  (command: 'identify', userId: string, properties?: SmartlookUserProperties): void;
  (command: 'anonymize'): void;
  (command: 'track', eventName: string, properties?: SmartlookEventProperties): void;
  (command: 'record', options: { forms?: boolean; ips?: boolean; emails?: boolean; numbers?: boolean }): void;
  (command: 'pause'): void;
  (command: 'resume'): void;
  (command: 'disable'): void;
  (command: 'consentIP', consent: boolean): void;
  (command: 'consentAPI', consent: boolean): void;
  (command: 'getData', callback: (data: { visitorId: string; sessionId: string; recordId: string }) => void): void;
  (command: 'restart'): void;
  (command: 'error', error: Error): void;
  api: unknown[];
}

declare global {
  interface Window {
    smartlook: SmartlookFunction;
  }
}

export {};

