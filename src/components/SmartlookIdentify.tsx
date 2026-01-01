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
        const userId = session.user.id || 'anonymous';
        identifyUser(userId);
        hasIdentified.current = true;
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

