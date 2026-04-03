import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CountryProfile from '@/components/countries/CountryProfile';

/**
 * Wrapper page for /countries/:id route.
 * Fetches the country name from the API and passes it to CountryProfile.
 */
const CountryProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [countryName, setCountryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    fetch(`${apiBase}/countries/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Country not found');
        return res.json();
      })
      .then((data) => {
        setCountryName(data.name);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !countryName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{error || 'Country not found'}</p>
      </div>
    );
  }

  return <CountryProfile country={countryName} />;
};

export default CountryProfilePage;
