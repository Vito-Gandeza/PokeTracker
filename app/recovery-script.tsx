'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function RecoveryScript() {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById('recovery-script')) {
      setScriptLoaded(true);
      return;
    }

    // Create and append script manually to ensure it loads properly
    const script = document.createElement('script');
    script.id = 'recovery-script';
    script.src = '/recovery.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = (error) => console.error('Error loading recovery script:', error);

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Don't remove the script on component unmount to keep recovery functionality
    };
  }, []);

  // Return null as we're manually adding the script
  return null;
}
