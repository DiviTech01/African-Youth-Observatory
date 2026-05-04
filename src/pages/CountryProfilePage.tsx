import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/**
 * Wrapper page for /dashboard/countries/:id and /countries/:id.
 *
 * The "country report card" is now exclusively the PKPB document (or its
 * "Coming soon" placeholder when no upload exists yet) — there's no
 * parametric, generic Nigeria-template fallback. Forward to the canonical
 * PKPB country route so the same logic owns rendering for every entry point.
 */
const CountryProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/dashboard/pkpb" replace />;
  return <Navigate to={`/dashboard/pkpb/${id}`} replace />;
};

export default CountryProfilePage;
