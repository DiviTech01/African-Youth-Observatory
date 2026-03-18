// ============================================
// AFRICAN YOUTH DATABASE - AI INSIGHTS PAGE
// Comprehensive AI-powered analysis and recommendations
// ============================================

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { InsightsDashboard } from '@/components/insights';
import { Brain } from 'lucide-react';

const Insights = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <header className="gradient-hero py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="section-title">AI-Powered Insights</h1>
          </div>
          <p className="section-description max-w-2xl">
            Intelligent analysis of youth development trends, patterns, and recommendations 
            across 54 African countries. Powered by advanced data analytics.
          </p>
        </div>
      </header>
      
      <main className="flex-grow py-6">
        <div className="container px-4 md:px-6">
          <InsightsDashboard year={2024} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Insights;
