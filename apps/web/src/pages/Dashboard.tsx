// ============================================
// AFRICAN YOUTH OBSERVATORY - DASHBOARD PAGE
// Customizable dashboard for data exploration
// ============================================

import React from 'react';
import { DashboardBuilder } from '@/components/dashboard';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <DashboardBuilder />
    </div>
  );
};

export default Dashboard;
