import React from 'react';
import { useParams } from 'react-router-dom';
import CountryReportCard from '@/pages/CountryReportCard';
import { getCountryReport } from '@/data/countryReports';

/**
 * Wrapper page for /countries/:id route.
 * `id` is a country slug (e.g. "nigeria", "south-africa"). Resolves to the
 * matching CountryReport and renders the Promise Kept · Promise Broken card.
 */
const CountryProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const report = id ? getCountryReport(id) : null;

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No report card available for "{id}".</p>
      </div>
    );
  }

  return <CountryReportCard country={report.country} />;
};

export default CountryProfilePage;
