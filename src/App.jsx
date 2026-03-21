import Navbar from './components/common/Navbar';
import HeroSection from './components/sections/HeroSection/index';
import ManifestoSection from './components/sections/ManifestoSection';
import HowItWorksSection from './components/sections/HowItWorksSection';
import BrandStorySection from './components/sections/BrandStorySection';
import AppCtaSection from './components/sections/AppCtaSection';

export default function App() {
  return (
    <>
      {/* Navbar — 페이지 레벨 sticky, 섹션 밖 */}
      <Navbar />

      <main>
        {/* 1. Hero — Three.js 풀스크린 */}
        <HeroSection />

        {/* 2. Manifesto — N400 배경 */}
        <ManifestoSection />

        {/* 3. How it works — N50 배경 */}
        <HowItWorksSection />

        {/* 4. Brand Story — W200 배경 */}
        <BrandStorySection />

        {/* 5. App CTA + Footer — N400 배경 */}
        <AppCtaSection />
      </main>
    </>
  );
}
