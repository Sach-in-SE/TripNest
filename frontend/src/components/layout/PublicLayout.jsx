import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export const PublicLayout = ({ children }) => {
  return (
    <div className="tn-app-shell">
      <Navbar />
      <main style={{ flex: 1, marginTop: 'var(--tn-navbar-height)', minHeight: 'calc(100vh - var(--tn-navbar-height))' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
