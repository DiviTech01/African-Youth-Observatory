import React from 'react';
import { useParams } from 'react-router-dom';
import CountryReportCard from '@/pages/CountryReportCard';
import { useCountryReportData } from '@/hooks/useCountryReportData';

/**
 * Wrapper page for /countries/:id route.
 *
 * `id` is a country slug (e.g. "nigeria", "south-africa"). The useCountryReportData
 * hook overlays real IndicatorValue data on top of the parametric defaults — any
 * field with a real number wins, the rest stay parametric. The PKPB page handles
 * its own additional layer for uploaded document summaries.
 */
const CountryProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { report, isLoading } = useCountryReportData(id);

  if (isLoading && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No report card available for "{id}".</p>
      </div>
    );
  }

  return <CountryReportCard country={report.country} reportOverride={report} />;
};

export default CountryProfilePage;
