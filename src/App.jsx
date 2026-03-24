import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import Navbar from './components/common/Navbar';
import ParticleCanvas from './components/common/ParticleCanvas';
import HeroSection from './components/sections/HeroSection/index';
import ManifestoSection from './components/sections/ManifestoSection';
import HowItWorksSection from './components/sections/HowItWorksSection';
import BrandStorySection from './components/sections/BrandStorySection';
import AppCtaSection from './components/sections/AppCtaSection';
import PrivacyPage from './pages/PrivacyPage';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <ParticleCanvas />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <HeroSection />
            </Layout>
          }
        />
        <Route
          path="/manifesto"
          element={
            <Layout>
              <ManifestoSection />
            </Layout>
          }
        />
        <Route
          path="/how-it-works"
          element={
            <Layout>
              <HowItWorksSection />
            </Layout>
          }
        />
        <Route
          path="/brand-story"
          element={
            <Layout>
              <BrandStorySection />
            </Layout>
          }
        />
        <Route
          path="/app"
          element={
            <Layout>
              <AppCtaSection />
            </Layout>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
