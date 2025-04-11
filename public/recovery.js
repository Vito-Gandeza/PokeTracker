/**
 * Recovery script for handling connection issues
 * This script is loaded in the HTML head to detect and recover from common issues
 */
(function() {
  // Configuration
  const CONFIG = {
    // How long to wait before considering the app as stuck (in milliseconds)
    loadTimeout: 10000,
    // How many failed API requests to track
    maxTrackedFailures: 10,
    // How many consecutive failures before taking action
    failureThreshold: 3,
    // Minimum time between recovery attempts (in milliseconds)
    recoveryDebounce: 30000,
    // URLs to ping to check connectivity
    healthCheckUrls: [
      '/api/test-connection',
      'https://znvwokdnmwbkuavsxqin.supabase.co/rest/v1/health'
    ]
  };

  // State
  let state = {
    lastRecoveryAttempt: 0,
    failedRequests: [],
    isRecovering: false,
    originalFetch: null,
    originalXHR: null
  };

  // Initialize state when window is available
  if (typeof window !== 'undefined') {
    state.originalFetch = window.fetch;
    state.originalXHR = window.XMLHttpRequest;
  }

  // Initialize on page load if in browser environment
  if (typeof window !== 'undefined') {
    window.addEventListener('load', function() {
      initializeRecovery();
    });
  }

  // Initialize recovery mechanisms
  function initializeRecovery() {
    console.log('[Recovery] Initializing recovery mechanisms');

    // Set up load timeout detection
    setupLoadTimeoutDetection();

    // Monitor fetch requests
    monitorFetchRequests();

    // Monitor XHR requests
    monitorXHRRequests();

    // Set up periodic health checks
    setupPeriodicHealthChecks();

    // Listen for online/offline events
    setupConnectivityListeners();
  }

  // Set up detection for app getting stuck during loading
  function setupLoadTimeoutDetection() {
    setTimeout(function() {
      // Check if the app appears to be stuck loading
      const loadingIndicators = document.querySelectorAll('.animate-spin, .loading');
      const appContent = document.querySelector('main');

      if (loadingIndicators.length > 0 && (!appContent || appContent.children.length < 2)) {
        console.warn('[Recovery] App appears to be stuck loading');
        attemptRecovery('load-timeout');
      }
    }, CONFIG.loadTimeout);
  }

  // Monitor fetch requests for failures
  function monitorFetchRequests() {
    // Store the original fetch function
    const originalFetch = window.fetch;

    // Override the fetch function
    window.fetch = function(...args) {
      try {
        const request = originalFetch.apply(this, args);

        request.catch(error => {
          console.warn('[Recovery] Fetch request failed:', error);
          trackFailedRequest(args[0], error);
        });

        return request;
      } catch (error) {
        console.warn('[Recovery] Error in fetch override:', error);
        // Fall back to original fetch
        return originalFetch.apply(this, args);
      }
    };
  }

  // Monitor XHR requests for failures
  function monitorXHRRequests() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
      this._recoveryUrl = url;
      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
      this.addEventListener('error', () => {
        console.warn('[Recovery] XHR request failed:', this._recoveryUrl);
        trackFailedRequest(this._recoveryUrl, new Error('XHR request failed'));
      });

      return originalSend.apply(this, arguments);
    };
  }

  // Track failed requests and trigger recovery if needed
  function trackFailedRequest(url, error) {
    // Only track API and Supabase requests
    if (typeof url === 'string' && (url.includes('/api/') || url.includes('supabase'))) {
      const now = Date.now();

      // Add to failed requests
      state.failedRequests.push({
        url: url,
        timestamp: now,
        error: error.message
      });

      // Keep only the most recent failures
      if (state.failedRequests.length > CONFIG.maxTrackedFailures) {
        state.failedRequests.shift();
      }

      // Check for consecutive failures in the last 10 seconds
      const recentFailures = state.failedRequests.filter(f =>
        now - f.timestamp < 10000
      );

      if (recentFailures.length >= CONFIG.failureThreshold) {
        attemptRecovery('consecutive-failures');
      }
    }
  }

  // Set up periodic health checks
  function setupPeriodicHealthChecks() {
    // Check health every 30 seconds
    setInterval(checkHealth, 30000);
  }

  // Check API and Supabase health
  function checkHealth() {
    CONFIG.healthCheckUrls.forEach(url => {
      try {
        fetch(url, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        })
        .then(response => {
          if (!response.ok) {
            console.warn(`[Recovery] Health check failed for ${url}: ${response.status}`);
            trackFailedRequest(url, new Error(`Health check failed: ${response.status}`));
          }
        })
        .catch(error => {
          console.warn(`[Recovery] Health check error for ${url}:`, error);
          trackFailedRequest(url, error);
        });
      } catch (error) {
        console.warn(`[Recovery] Failed to initiate health check for ${url}:`, error);
      }
    });
  }

  // Set up listeners for online/offline events
  function setupConnectivityListeners() {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.addEventListener('online', () => {
        console.log('[Recovery] Browser reports online status');
        checkHealth();
      });

      window.addEventListener('offline', () => {
        console.warn('[Recovery] Browser reports offline status');
      });
    } catch (error) {
      console.error('[Recovery] Error setting up connectivity listeners:', error);
    }
  }

  // Attempt recovery based on the issue
  function attemptRecovery(reason) {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const now = Date.now();

      // Debounce recovery attempts
      if (state.isRecovering || now - state.lastRecoveryAttempt < CONFIG.recoveryDebounce) {
        return;
      }

      console.log(`[Recovery] Attempting recovery due to: ${reason}`);
      state.isRecovering = true;
      state.lastRecoveryAttempt = now;

      // Clear any problematic cache or state
      clearProblemCache();

      // Show recovery UI
      showRecoveryUI(reason);

      // Attempt to reload the page after a short delay
      setTimeout(() => {
        state.isRecovering = false;
        try {
          if (window.confirm('The application is experiencing connectivity issues. Would you like to reload the page?')) {
            window.location.reload();
          }
        } catch (error) {
          console.error('[Recovery] Error showing confirmation dialog:', error);
          // Fallback: just reload the page
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error('[Recovery] Error during recovery attempt:', error);
    }
  }

  // Clear any problematic cache or state
  function clearProblemCache() {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Clear session storage (but not local storage to preserve auth)
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.error('[Recovery] Failed to clear sessionStorage:', e);
    }

    // Clear any problematic cookies
    try {
      if (document.cookie) {
        document.cookie.split(';').forEach(function(c) {
          if (c.trim().startsWith('sb-')) {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
          }
        });
      }
    } catch (e) {
      console.error('[Recovery] Failed to clear cookies:', e);
    }
  }

  // Show recovery UI
  function showRecoveryUI(reason) {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    try {
      // Create recovery UI if it doesn't exist
      let recoveryUI = document.getElementById('recovery-ui');

      if (!recoveryUI) {
        recoveryUI = document.createElement('div');
        recoveryUI.id = 'recovery-ui';
        recoveryUI.style.position = 'fixed';
        recoveryUI.style.top = '0';
        recoveryUI.style.left = '0';
        recoveryUI.style.right = '0';
        recoveryUI.style.backgroundColor = '#f44336';
        recoveryUI.style.color = 'white';
        recoveryUI.style.padding = '10px';
        recoveryUI.style.textAlign = 'center';
        recoveryUI.style.zIndex = '9999';
        recoveryUI.style.fontFamily = 'Arial, sans-serif';

        document.body.appendChild(recoveryUI);
      }

      recoveryUI.innerHTML = `
        <p>Experiencing connectivity issues. Attempting to recover...</p>
      `;
    } catch (error) {
      console.error('[Recovery] Error showing recovery UI:', error);
    }
  }
})();
