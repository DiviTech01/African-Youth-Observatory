
import React from 'react';
import { Hero } from '@/components/ui/hero-1';
import SaaSHero from '@/components/ui/saa-s-template';
import QuickStats from '@/components/home/QuickStats';
import FeaturedData from '@/components/home/FeaturedData';
import Partners from '@/components/home/Partners';

const Index = () => {
  return (
    <>
      <Hero
        eyebrow="Africa's Premier Youth Data Platform"
        title="Empowering Africa's Youth Through Data"
        subtitle="Access comprehensive youth statistics across all 54 African nations. Power your research, policy decisions, and investments with trusted, real-time data."
        ctaLabel="Explore Data"
        ctaHref="/explore"
      />
      <SaaSHero />
      <QuickStats />
      <FeaturedData />
      <Partners />
    </>
  );
};

export default Index;
