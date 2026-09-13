import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/**
 * Wrapper page for /countries/:id, /dashboard/countries/:id and the legacy
 * /pkpb/:id links.
 *
 * These used to forward to the PKPB country report. PKPB is withdrawn pending
 * sourcing + legal review, so every entry point now lands on the country's
 * data profile. CountryDataProfile resolves slugs, names and ISO3 codes.
 */
const CountryProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/dashboard/countries" replace />;
  return <Navigate to={`/dashboard/profile/${encodeURIComponent(id)}`} replace />;
};

export default CountryProfilePage;
