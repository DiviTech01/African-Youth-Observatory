
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/home/Hero';
import QuickStats from '@/components/home/QuickStats';
import FeaturedData from '@/components/home/FeaturedData';
import Partners from '@/components/home/Partners';
import { QuickInsights } from '@/components/insights';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <QuickStats />
        <FeaturedData />
        
        {/* AI Insights Section */}
        <section className="py-12 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-lg mx-auto">
              <QuickInsights limit={3} year={2024} />
            </div>
          </div>
        </section>
        
        <Partners />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
