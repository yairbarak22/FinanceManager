'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { identifyUser, isSmartlookAvailable } from '@/lib/smartlook';

/**
 * SmartlookIdentify - Identifies the user in Smartlook when session is available
 * 
 * This component should be placed in the layout to automatically
 * identify users when they log in.
 */
export default function SmartlookIdentify() {
  const { data: session, status } = useSession();
  const hasIdentified = useRef(false);

  useEffect(() => {
    // Only identify once per session
    if (hasIdentified.current) return;
    
    // Wait for session to be loaded
    if (status !== 'authenticated' || !session?.user) return;

    // Wait for Smartlook to be available (might still be loading)
    const checkAndIdentify = () => {
      if (isSmartlookAvailable() && session.user) {
        // PRIVACY: Only pass internal userId - NO PII (email, name, etc.)
        // Ensure we never send email as user ID - only use the database CUID
        const userId = session.user.id;
        
        // Only identify if we have a proper CUID (not email)
        // CUIDs look like: "cmj8phrqa0000zf4374r18w73"
        if (userId && !userId.includes('@')) {
          identifyUser(userId);
          hasIdentified.current = true;
        } else {
          // If no proper ID, don't identify - keep user anonymous
          console.debug('[Smartlook] Skipping identify - no valid non-PII user ID');
        }
      }
    };

    // Try immediately
    checkAndIdentify();

    // Also try after a delay (in case Smartlook is still loading)
    const timer = setTimeout(checkAndIdentify, 2000);
    
    return () => clearTimeout(timer);
  }, [session, status]);

  // This component doesn't render anything
  return null;
}

