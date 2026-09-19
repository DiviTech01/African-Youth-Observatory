import React from 'react';
import { Link } from 'react-router-dom';
import LegalDocument, { LegalSection } from './LegalDocument';
import { LEGAL_CONTACT } from '@/config/legal';

const mailto = (address: string) => <a href={`mailto:${address}`}>{address}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: 'summary',
    heading: 'In short',
    body: (
      <>
        <ul>
          <li>
            <strong>Our own work is CC BY 4.0.</strong> The AYO compilation, the Youth Index, our
            country profiles and our written analysis may be reused, including commercially, with
            attribution.
          </li>
          <li>
            <strong>Republished series keep their original licence.</strong> A figure sourced from the
            World Bank, WHO, UNESCO or ILO stays under that organisation's terms, which we cannot and
            do not relicense.
          </li>
          <li>
            <strong>Cite the original source, not just us.</strong> Every value on AYO names where it
            came from, and exports carry that per row.
          </li>
        </ul>
        <p>
          The rest of this page is the detail, because "CC BY 4.0" alone would be an overclaim for
          part of the database.
        </p>
      </>
    ),
  },
  {
    id: 'ayo-own-work',
    heading: "AYO's own work",
    body: (
      <>
        <p>
          The following are ours to licence, and we licence them under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Creative Commons Attribution 4.0 International (CC BY 4.0)
          </a>
          :
        </p>
        <ul>
          <li>the selection, structure and harmonisation of indicators — the compilation itself;</li>
          <li>
            the Youth Index: its dimensions, weights, normalisation and the scores and ranks it
            produces;
          </li>
          <li>our written analysis, country profiles, methodology notes and generated reports;</li>
          <li>the policy database we assembled from national youth policy documents.</li>
        </ul>
        <p>
          Suggested attribution: <em>African Youth Observatory (PACSDA), africanyouthobservatory.org,
          accessed [date], CC BY 4.0.</em>
        </p>
      </>
    ),
  },
  {
    id: 'upstream',
    heading: 'Data we republish from others',
    body: (
      <>
        <p>
          Much of the statistical data on AYO originates with international organisations. We
          republish it to make it comparable and usable in one place; we do not own it, and your
          obligations run to the original publisher as well as to us. The main sources and their
          terms:
        </p>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Typical licence</th>
              <th>What that means for you</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>World Bank (World Development Indicators)</td>
              <td>CC BY 4.0</td>
              <td>Reuse, including commercially, with attribution to the World Bank.</td>
            </tr>
            <tr>
              <td>UNESCO Institute for Statistics</td>
              <td>CC BY-SA 3.0 IGO</td>
              <td>Attribution, and derivative works must be shared under the same licence.</td>
            </tr>
            <tr>
              <td>WHO / UNAIDS</td>
              <td>CC BY-NC-SA 3.0 IGO</td>
              <td>
                <strong>Non-commercial use only</strong>, with attribution and share-alike. If your
                use is commercial, go to WHO for permission — our CC BY 4.0 grant cannot cover these
                series.
              </td>
            </tr>
            <tr>
              <td>ILO (ILOSTAT)</td>
              <td>ILO terms of use</td>
              <td>Attribution to the ILO; check ILOSTAT's conditions for redistribution.</td>
            </tr>
            <tr>
              <td>UN DESA, IPU and other UN bodies</td>
              <td>Varies by dataset</td>
              <td>Check the publisher's terms for the specific series.</td>
            </tr>
            <tr>
              <td>Partner institutions submitting data to AYO</td>
              <td>As agreed with the contributor</td>
              <td>The named source on the row governs. Ask us if it is not clear.</td>
            </tr>
          </tbody>
        </table>
        <p>
          Licences change and vary by dataset. The table above describes each organisation's usual
          terms and is not a substitute for checking the source for a series you intend to
          redistribute. Where a row's licence conflicts with anything on this page, the original
          publisher's terms win.
        </p>
      </>
    ),
  },
  {
    id: 'provenance',
    heading: 'How to find the source of a figure',
    body: (
      <>
        <p>
          Every stored value carries the source we recorded for it, the year, the age band it applies
          to, and a flag saying whether it is an estimate. You can see this on a country profile, and
          every CSV export includes those columns for every row — that is the intended path for
          anyone citing our data.
        </p>
        <p>
          Where a value is an estimate or was gap-filled, treat it as ours, not the upstream
          organisation's, and do not attribute it to them. Our{' '}
          <Link to="/resources/methodology">Methodology</Link> explains how those are produced.
        </p>
      </>
    ),
  },
  {
    id: 'api',
    heading: 'The API and bulk use',
    body: (
      <>
        <p>
          Our API is open and needs no key for read access. It is rate limited per IP so that one
          caller cannot degrade the service for everyone else. The same licence terms apply to data
          you take through the API as to data you take from the site.
        </p>
        <p>
          If you want to mirror a large part of the database, integrate AYO into a product, or need a
          higher rate limit, email {mailto(LEGAL_CONTACT.data)} and we will sort it out. We would
          rather help you than throttle you.
        </p>
      </>
    ),
  },
  {
    id: 'no-warranty',
    heading: 'No warranty',
    body: (
      <p>
        A licence to reuse is not a promise of accuracy. Coverage is uneven, some values are
        estimates, and upstream sources revise their numbers — see the accuracy section of our{' '}
        <Link to="/terms">Terms of Service</Link>, and verify against the original source before you
        publish. Report errors to {mailto(LEGAL_CONTACT.data)}.
      </p>
    ),
  },
];

const DataLicensing = () => (
  <LegalDocument
    title="Data Licensing"
    summary="What you may do with data from the African Youth Observatory, and the obligations that come from the organisations whose data we republish."
    sections={SECTIONS}
  />
);

export default DataLicensing;
