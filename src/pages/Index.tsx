
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/home/Hero';
import QuickStats from '@/components/home/QuickStats';
import FeaturedData from '@/components/home/FeaturedData';
import Partners from '@/components/home/Partners';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <QuickStats />
        <FeaturedData />
        <Partners />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
