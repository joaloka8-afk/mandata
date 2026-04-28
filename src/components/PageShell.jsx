import React from 'react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

const PageShell = ({ children, hideFooter = false, fullBleed = false }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={fullBleed ? 'flex-1' : 'flex-1'}>{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default PageShell;
