
import React from 'react';
import { Hero } from '@/components/ui/hero-1';
import SaaSHero from '@/components/ui/saa-s-template';
import QuickStats from '@/components/home/QuickStats';
import FeaturedData from '@/components/home/FeaturedData';
import Partners from '@/components/home/Partners';
import { useContentText } from '@/contexts/ContentContext';

const Index = () => {
  const eyebrow = useContentText('home.hero.eyebrow', "Africa's Premier Youth Data Platform");
  const title = useContentText('home.hero.title', "Empowering Africa's Youth Through Data");
  const subtitle = useContentText(
    'home.hero.subtitle',
    'Access comprehensive youth statistics across all 54 African nations. Power your research, policy decisions, and investments with trusted, real-time data.',
  );
  const ctaLabel = useContentText('home.hero.cta_label', 'Explore Data');

  return (
    <>
      <Hero eyebrow={eyebrow} title={title} subtitle={subtitle} ctaLabel={ctaLabel} ctaHref="/explore" />
      <SaaSHero />
      <QuickStats />
      <FeaturedData />
      <Partners />
    </>
  );
};

export default Index;
