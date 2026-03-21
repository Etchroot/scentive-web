import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import HeroSection from './components/sections/HeroSection/index';
import ManifestoSection from './components/sections/ManifestoSection';
import HowItWorksSection from './components/sections/HowItWorksSection';
import BrandStorySection from './components/sections/BrandStorySection';
import AppCtaSection from './components/sections/AppCtaSection';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}
