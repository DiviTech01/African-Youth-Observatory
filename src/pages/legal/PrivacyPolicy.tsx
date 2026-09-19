import React from 'react';
import { Link } from 'react-router-dom';
import LegalDocument, { LegalSection } from './LegalDocument';
import { LEGAL_CONTACT } from '@/config/legal';

const mailto = (address: string) => <a href={`mailto:${address}`}>{address}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: 'who-we-are',
    heading: 'Who we are',
    body: (
      <>
        <p>
          The African Youth Observatory ("AYO", "we") publishes open statistical data on youth
          across the 54 countries of Africa. AYO is an initiative of the Pan-African Centre for
          Sustainable Development in Africa (PACSDA), which is the controller of the personal data
          described in this policy.
        </p>
        <p>
          For any question about this policy, or to exercise the rights in section 7, write to{' '}
          {mailto(LEGAL_CONTACT.privacy)}. We answer within 30 days.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    heading: 'What we collect',
    body: (
      <>
        <p>
          Most of AYO is readable without an account, and we do not ask you to identify yourself to
          browse data. We hold personal data in four situations:
        </p>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>What</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>You create an account</td>
              <td>Email address, password (stored only as a hash by our authentication provider), display name, and optionally your organisation</td>
              <td>To give you an account, sign you in, and let you save dashboards</td>
            </tr>
            <tr>
              <td>You subscribe to the newsletter</td>
              <td>Email address, and the date you subscribed</td>
              <td>To send you the briefing you asked for</td>
            </tr>
            <tr>
              <td>You contact us</td>
              <td>Your name, email address, and your message</td>
              <td>To reply to you</td>
            </tr>
            <tr>
              <td>You ask the AI assistant a question or generate a report</td>
              <td>The text of your question, and the data the assistant retrieved to answer it</td>
              <td>To produce the answer. See section 4.</td>
            </tr>
          </tbody>
        </table>
        <p>
          Our servers also write standard technical logs — request path, response status, timing, and
          the requesting IP address — which we use to keep the service up and to enforce rate limits
          against abuse. We do not build profiles from them.
        </p>
        <p>
          <strong>We do not run advertising, and we do not sell or rent personal data to anyone, for
          any purpose.</strong>
        </p>
      </>
    ),
  },
  {
    id: 'lawful-basis',
    heading: 'Our lawful basis for using it',
    body: (
      <>
        <p>Where the UK/EU GDPR or a comparable law applies, we rely on:</p>
        <ul>
          <li>
            <strong>Contract</strong> — to operate your account and provide the features you sign in
            for.
          </li>
          <li>
            <strong>Consent</strong> — for the newsletter, and for any non-essential cookie. You can
            withdraw consent at any time; every newsletter carries an unsubscribe link.
          </li>
          <li>
            <strong>Legitimate interests</strong> — for security logging, rate limiting, and keeping
            the platform running. We use the least data that achieves this.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'processors',
    heading: 'Who processes data on our behalf',
    body: (
      <>
        <p>
          We use the following processors. Each handles data only on our instructions, and this list
          is complete as of the date at the top of this page:
        </p>
        <table>
          <thead>
            <tr>
              <th>Processor</th>
              <th>Purpose</th>
              <th>What it receives</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase</td>
              <td>Authentication and the application database</td>
              <td>Account email, password hash, profile fields, saved dashboards</td>
            </tr>
            <tr>
              <td>Render</td>
              <td>Hosting for our API</td>
              <td>Request data in transit, including technical logs</td>
            </tr>
            <tr>
              <td>Cloudflare</td>
              <td>Hosting and delivery of the website; document storage (R2)</td>
              <td>Request data in transit; uploaded and generated documents</td>
            </tr>
            <tr>
              <td>Anthropic</td>
              <td>The AI assistant and AI-generated reports</td>
              <td>The text of your question and the statistical data needed to answer it</td>
            </tr>
            <tr>
              <td>Resend</td>
              <td>Sending email — account email, replies, and the newsletter</td>
              <td>Recipient email address and message content</td>
            </tr>
          </tbody>
        </table>
        <p>
          These providers operate outside some of the countries our visitors are in, so using AYO
          involves international transfers of the data listed above. Where the GDPR applies, those
          transfers are covered by the providers' standard contractual clauses.
        </p>
      </>
    ),
  },
  {
    id: 'ai',
    heading: 'What happens when you use the AI features',
    body: (
      <>
        <p>
          When you ask the assistant a question or generate a report, your question text and the
          statistical figures needed to answer it are sent to Anthropic's Claude API, which returns
          the answer. Anthropic processes it to serve that request.
        </p>
        <p>
          Please do not put personal details about yourself or anyone else into a question. The
          assistant is a tool for querying published statistics and needs nothing personal to do its
          job. Questions may be cached briefly on our servers so that a repeated question does not
          have to be recomputed.
        </p>
        <p>
          AI-generated answers and reports can be wrong. They are a starting point for research, not
          a citable source — see the accuracy disclaimer in our{' '}
          <Link to="/terms">Terms of Service</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    heading: 'How long we keep it',
    body: (
      <ul>
        <li>
          <strong>Account data</strong> — for as long as your account exists, and deleted when you
          delete your account (section 7).
        </li>
        <li>
          <strong>Newsletter subscription</strong> — until you unsubscribe, after which we keep only
          the fact that the address opted out, so we do not email it again.
        </li>
        <li>
          <strong>Contact messages</strong> — up to 24 months, so we have the history of a
          conversation.
        </li>
        <li>
          <strong>Technical logs</strong> — up to 90 days.
        </li>
      </ul>
    ),
  },
  {
    id: 'your-rights',
    heading: 'Your rights, including deleting your account',
    body: (
      <>
        <p>
          You can ask us to give you a copy of your data, correct it, delete it, restrict or object
          to our use of it, or withdraw a consent you gave. Write to{' '}
          {mailto(LEGAL_CONTACT.privacy)}, or use the controls in the app.
        </p>
        <p>
          <strong>Deleting your account.</strong> Signed-in users can delete their account and its
          data from <Link to="/settings">Settings</Link>, in both the website and the mobile app. You
          do not need to ask us, and you do not need to give a reason. If you would rather we did it,
          email {mailto(LEGAL_CONTACT.privacy)} from the address on the account and we will delete it
          within 30 days. Deletion removes your profile, your saved dashboards, and your newsletter
          subscription. It does not withdraw data you contributed as a named contributor to a
          published dataset, because that is part of the public record of where a figure came from —
          tell us if this affects you and we will discuss it.
        </p>
        <p>
          If you are in the EU/UK and think we have handled your data badly, you may complain to your
          national data protection authority. We would rather you told us first.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    heading: 'Young people and children',
    body: (
      <>
        <p>
          AYO is about young Africans, and we expect young people to use it. Anyone can read the
          data without an account.
        </p>
        <p>
          You must be <strong>16 or older to create an account</strong>, or 13 or older with the
          consent of a parent or guardian where your national law allows that. We do not knowingly
          keep account data for anyone under 13. If you believe a child under 13 has an account,
          email {mailto(LEGAL_CONTACT.privacy)} and we will delete it.
        </p>
        <p>
          We do not profile users, show behavioural advertising, or use any tracking designed to
          follow people between sites — measures that matter most for the youngest readers.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    heading: 'Security',
    body: (
      <p>
        Traffic to AYO is encrypted in transit. Passwords are never stored in a readable form.
        Administrative functions require an authenticated account with an explicit role. No service
        is immune to incident: if a breach affects your personal data and carries real risk to you,
        we will tell you and the relevant authority as the law requires.
      </p>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    body: (
      <p>
        When we change this policy we update the date at the top of the page. If a change materially
        affects how we use data you have already given us, we will say so on the site, and by email
        where we hold your address for that purpose.
      </p>
    ),
  },
];

const PrivacyPolicy = () => (
  <LegalDocument
    title="Privacy Policy"
    summary="What personal data the African Youth Observatory holds, why, who processes it, and how to get it deleted."
    sections={SECTIONS}
  />
);

export default PrivacyPolicy;
