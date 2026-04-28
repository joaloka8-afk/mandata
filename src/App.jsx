import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ConsolePage from './pages/ConsolePage.jsx';
import DocsPage from './pages/DocsPage.jsx';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/console" element={<ConsolePage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
};

export default App;
