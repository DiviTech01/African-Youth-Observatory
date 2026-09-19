import React from 'react';
import { Link } from 'react-router-dom';
import LegalDocument, { LegalSection } from './LegalDocument';
import { LEGAL_CONTACT } from '@/config/legal';

const mailto = (address: string) => <a href={`mailto:${address}`}>{address}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: 'what-we-use',
    heading: 'What we store on your device',
    body: (
      <>
        <p>
          AYO uses very little. We have no advertising, and no third-party tracker follows you from
          this site to another one. Everything below is stored by your own browser, in local storage
          rather than in cookies, and none of it is sent to a third party.
        </p>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Purpose</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>ayd_token</code>
              </td>
              <td>Keeps you signed in between visits. Only set once you sign in.</td>
              <td>Strictly necessary</td>
            </tr>
            <tr>
              <td>
                <code>ayd_user_preferences</code>
              </td>
              <td>
                Remembers your choices — interface language, theme, and similar — so the site opens
                the way you left it.
              </td>
              <td>Functional</td>
            </tr>
            <tr>
              <td>
                <code>ayd_cookie_consent</code>
              </td>
              <td>Remembers the choice you made in the consent banner, so we stop asking.</td>
              <td>Strictly necessary</td>
            </tr>
          </tbody>
        </table>
        <p>
          Our hosting providers may set a strictly necessary cookie for security and load balancing
          when you request a page. Those are required to deliver the site and carry no analytics.
        </p>
      </>
    ),
  },
  {
    id: 'analytics',
    heading: 'Analytics',
    body: (
      <p>
        We currently run <strong>no analytics or advertising cookies at all</strong>. If we add
        product analytics later, it will be listed here before it is switched on, it will be in the
        "analytics" category, and it will only run if you have accepted that category. If you have
        rejected non-essential storage, it will not run.
      </p>
    ),
  },
  {
    id: 'your-choice',
    heading: 'Your choice, and how to change it',
    body: (
      <>
        <p>
          The banner on your first visit lets you accept or reject everything that is not strictly
          necessary. Rejecting is a real choice: the site works, and we do not ask again on every
          page.
        </p>
        <p>
          To change your mind, clear this site's data in your browser settings and the banner will
          appear again on your next visit. Clearing it also signs you out, since the sign-in token
          lives in the same storage.
        </p>
        <p>
          Blocking strictly necessary storage entirely will stop you from staying signed in, but you
          can still read all the public data.
        </p>
      </>
    ),
  },
  {
    id: 'more',
    heading: 'More information',
    body: (
      <p>
        What we do with personal data more generally is in our{' '}
        <Link to="/privacy">Privacy Policy</Link>. Questions about this page:{' '}
        {mailto(LEGAL_CONTACT.privacy)}.
      </p>
    ),
  },
];

const CookiePolicy = () => (
  <LegalDocument
    title="Cookie Policy"
    summary="Everything AYO stores on your device, why, and how to refuse the parts that are not strictly necessary."
    sections={SECTIONS}
  />
);

export default CookiePolicy;
