import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CountryProfile from '@/components/countries/CountryProfile';
import { listCountries } from '@/data/countryReports';

/**
 * /dashboard/profile/:slug — full country data profile with charts/tabs.
 * Reached from clicking a country in the Youth Index (strip or rankings table).
 * The Promise Kept · Promise Broken report card lives at /dashboard/countries/:slug.
 */
const CountryDataProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const match = slug
    ? listCountries().find((c) => c.slug === slug.toLowerCase())
    : null;

  if (!match) {
    return (
      <div className="container px-4 md:px-6 py-12">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-center py-20 text-gray-400">
          No country profile found for "{slug}".
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-4 md:mb-6 gap-2 text-sm border-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Youth Index
      </Button>
      <CountryProfile country={match.country} />
    </div>
  );
};

export default CountryDataProfile;
