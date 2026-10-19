// RETIRED 2026-10-19. This standalone runner duplicated the pre-2026-10 Youth
// Index algorithm: blanket 15-35 age filter, regional-average / flat-50
// imputation, youth share scored higher-is-better, raw headcounts. Running it
// would overwrite honest scores with imputed ones, so it now refuses to run.
//
// Recompute with the current calculator instead (dry run by default):
//   cd apps/api
//   npx tsx "../../../audit-2026-10/recompute-index-2026-10-19.js" [--apply]
// or, against a running API: POST /api/youth-index/compute-all (admin).
console.error('compute-youth-index-7theme.js is retired: it imputes 50s. See the header for the replacement.');
process.exit(1);
