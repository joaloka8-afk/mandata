import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ConsolePage from './pages/ConsolePage.jsx';
import DocsPage from './pages/DocsPage.jsx';
import { SignInPage, SignUpPage, RequireAuth } from './pages/AuthPages.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
        <Route
          path="/console"
          element={
            <RequireAuth>
              <ConsolePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
