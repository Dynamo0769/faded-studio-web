import React from 'react';

// Import your pages
import UserSite from './pages/UserSite';
import AdminSite from './pages/AdminSite';

function App() {
  // Grab the exact path from the browser's URL bar
  const currentPath = window.location.pathname;

  // If you manually type localhost:5173/admin, it loads this:
  if (currentPath === '/admin') {
    return <AdminSite />;
  }

  // Otherwise (for localhost:5173 or anything else), it loads the normal site:
  return <UserSite />;
}

export default App;