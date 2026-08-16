import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export const UserLayout = ({ children }) => {
  return (
    <div className="tn-app-shell tn-user-layout">
      <Navbar />
      <div className="tn-layout-body">
        <main className="tn-main-content">
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
