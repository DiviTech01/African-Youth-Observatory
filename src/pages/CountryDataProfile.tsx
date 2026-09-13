import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CountryProfile from '@/components/countries/CountryProfile';
import { listCountries } from '@/data/countryReports';

// Reduce a slug / name / ISO3 to bare lowercase letters+digits, so
// "cote-d-ivoire", "côte-divoire" and "Côte d'Ivoire" all compare equal.
const squash = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Informal names used across the app and in old shared links.
const ALIASES: Record<string, string> = {
  drc: 'COD', drcongo: 'COD', congokinshasa: 'COD',
  congo: 'COG', congobrazzaville: 'COG',
  car: 'CAF', caboverde: 'CPV', ivorycoast: 'CIV', swaziland: 'SWZ',
};

function findCountry(ref: string) {
  const key = squash(decodeURIComponent(ref));
  const iso3 = ALIASES[key] ?? key.toUpperCase();
  return listCountries().find(
    (c) => squash(c.slug) === key || squash(c.country) === key || c.iso3 === iso3,
  ) ?? null;
}

/**
 * /dashboard/profile/:slug — full country data profile with charts/tabs.
 * Reached from the Countries grid, the Youth Index, and the redirects that
 * replaced the withdrawn PKPB country pages. Accepts slug, name or ISO3.
 */
const CountryDataProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const match = slug ? findCountry(slug) : null;

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
