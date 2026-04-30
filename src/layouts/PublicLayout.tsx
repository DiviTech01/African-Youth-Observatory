import React from 'react';
import MinimalHeader from '@/components/MinimalHeader';
import Footer from '@/components/Footer';
import MobileAppBanner from '@/components/MobileAppBanner';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <MinimalHeader />
      <main className="flex-grow overflow-x-hidden">{children}</main>
      <Footer />
      <MobileAppBanner />
    </div>
  );
};

export default PublicLayout;
