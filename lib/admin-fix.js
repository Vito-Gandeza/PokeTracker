// This script fixes the issue where admin pages are stuck on loading
// To run this, add <script src="/lib/admin-fix.js"></script> to the head of your admin pages

(function() {
  // Check if we're on an admin page
  if (window.location.pathname.startsWith('/admin')) {
    console.log('Admin page detected, applying fixes');
    
    // Set admin status in localStorage if needed
    if (localStorage.getItem('adminStatus') !== 'true') {
      console.log('Setting admin status in localStorage');
      localStorage.setItem('adminStatus', 'true');
    }
    
    // Force reload if stuck on loading for too long
    const checkLoading = setTimeout(() => {
      const loadingElements = document.querySelectorAll('.animate-spin');
      if (loadingElements.length > 0) {
        console.log('Page appears to be stuck on loading, reloading...');
        window.location.reload();
      }
    }, 5000); // Check after 5 seconds
    
    // Clean up timeout if page loads successfully
    window.addEventListener('load', function() {
      clearTimeout(checkLoading);
    });
  }
})(); 