import React from 'react';
import { Link } from 'react-router-dom';
import LegalDocument, { LegalSection } from './LegalDocument';
import { LEGAL_CONTACT } from '@/config/legal';

const mailto = (address: string) => <a href={`mailto:${address}`}>{address}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: 'agreement',
    heading: 'This agreement',
    body: (
      <p>
        These terms govern your use of the African Youth Observatory — the website at
        africanyouthobservatory.org, the AYO mobile app, and our public API. The service is operated
        by {LEGAL_CONTACT.operator}. By using it you accept these terms. If you do not accept them,
        please do not use the service.
      </p>
    ),
  },
  {
    id: 'what-ayo-is',
    heading: 'What AYO is',
    body: (
      <>
        <p>
          AYO compiles youth-related statistics for all 54 African countries from international
          sources such as the World Bank, WHO, UNESCO, ILO and UN agencies, together with data
          submitted by partner institutions, and publishes them as indicators, country profiles,
          comparisons and a composite index, the AYEMI.
        </p>
        <p>
          AYO is a research and advocacy tool. It is not a statistical authority, and it does not
          speak for any government, the African Union, or any of the organisations whose data it
          republishes.
        </p>
      </>
    ),
  },
  {
    id: 'accuracy',
    heading: 'Accuracy — please read this one',
    body: (
      <>
        <p>
          <strong>
            The data on AYO is provided as is, with no warranty that it is accurate, complete or
            current.
          </strong>{' '}
          That is not boilerplate. It follows from how the data is made, and you should understand
          the specifics before you rely on a figure:
        </p>
        <ul>
          <li>
            Coverage is uneven. Many indicators have data for only some countries or some years, and
            a country's score on a composite measure reflects only the indicators that exist for it.
          </li>
          <li>
            Some figures are estimates, or are gap-filled from a nearby year. Where we know a value
            is an estimate we mark it as such, and exports carry that flag per row.
          </li>
          <li>
            Upstream sources revise their own numbers, sometimes substantially. A figure here reflects
            what the source said when we ingested it.
          </li>
          <li>
            The AYEMI is our own construction, not an official ranking. Its weights and its
            treatment of missing data are judgement calls, documented in our{' '}
            <Link to="/resources/methodology">Methodology</Link>. Small differences in rank between
            countries are not meaningful.
          </li>
          <li>
            AI-generated answers and reports are produced by a language model. They can misread the
            data or state something the data does not support.
          </li>
        </ul>
        <p>
          <strong>
            Before you publish, cite, or make a decision on any figure from AYO, verify it against the
            original source we name for it.
          </strong>{' '}
          If you find an error, please tell us at {mailto(LEGAL_CONTACT.data)} — we would rather fix
          it than defend it.
        </p>
      </>
    ),
  },
  {
    id: 'your-account',
    heading: 'Your account',
    body: (
      <>
        <p>
          You need an account for some features. You must give an email address you control, keep
          your credentials to yourself, and be at least 16 (or 13 with a parent's or guardian's
          consent, where your national law allows it).
        </p>
        <p>
          You may delete your account at any time from <Link to="/settings">Settings</Link>. We may
          suspend an account that is being used to attack the service or to break these terms, and we
          will tell you why where we can.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    heading: 'Acceptable use',
    body: (
      <>
        <p>Please do not:</p>
        <ul>
          <li>
            attack the service — no attempts to break authentication, no probing for vulnerabilities
            without our written agreement, no denial of service;
          </li>
          <li>
            scrape in a way that degrades the service for others. The public API and the export
            buttons exist so you do not have to: use them, and identify yourself if you are pulling
            data at volume;
          </li>
          <li>
            upload data you do not have the right to share, or that contains personal data about
            identifiable people;
          </li>
          <li>
            misrepresent AYO's data — including presenting a figure as official, or attributing our
            output to a source that did not produce it;
          </li>
          <li>use the service for anything unlawful.</li>
        </ul>
        <p>
          If you are a security researcher and you find a vulnerability, email{' '}
          {mailto(LEGAL_CONTACT.general)} before disclosing it. We will not pursue good-faith
          research that respects user data and does not degrade the service.
        </p>
      </>
    ),
  },
  {
    id: 'your-content',
    heading: 'Data you contribute',
    body: (
      <p>
        If you submit data, documents or corrections, you confirm you are entitled to do so and you
        grant us a non-exclusive, worldwide, royalty-free licence to publish it as part of AYO,
        including under the licence described in{' '}
        <Link to="/data-licensing">Data Licensing</Link>. You keep whatever rights you already had.
        We may edit, annotate or decline to publish a submission, and we may attribute it to you or
        your institution as part of its provenance record.
      </p>
    ),
  },
  {
    id: 'licensing',
    heading: 'Using AYO data and the API',
    body: (
      <p>
        What you may do with data you take from AYO — including attribution requirements and the
        obligations that come from the original sources — is set out in{' '}
        <Link to="/data-licensing">Data Licensing</Link>. The website's own design, code, text and
        branding remain ours unless a page says otherwise.
      </p>
    ),
  },
  {
    id: 'availability',
    heading: 'Availability',
    body: (
      <p>
        We offer no uptime guarantee. This is a public-interest project: features change, endpoints
        move, and the service can be down for maintenance or for reasons outside our control. If you
        depend on the API, cache what you need and handle failures.
      </p>
    ),
  },
  {
    id: 'liability',
    heading: 'Liability',
    body: (
      <>
        <p>
          To the fullest extent the law allows, AYO and PACSDA are not liable for indirect or
          consequential loss, lost profits, or any loss arising from a decision you took on the basis
          of data from this service. Where liability cannot be excluded, it is limited to the amount
          you paid us in the previous 12 months — which for almost every user is nothing.
        </p>
        <p>
          Nothing here limits liability for death or personal injury caused by negligence, for fraud,
          or for anything else that cannot lawfully be limited. If you are a consumer, this section
          does not affect your statutory rights.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes and governing law',
    body: (
      <>
        <p>
          We may update these terms. The date at the top of the page shows when they last changed,
          and material changes will be announced on the site. Continuing to use the service after a
          change means you accept the updated terms.
        </p>
        <p>
          These terms are governed by the law of the Federal Republic of Nigeria, and the courts of
          Nigeria have jurisdiction — without depriving you of any protection you have under the
          mandatory law of the country you live in.
        </p>
        <p>Questions about these terms: {mailto(LEGAL_CONTACT.general)}.</p>
      </>
    ),
  },
];

const TermsOfService = () => (
  <LegalDocument
    title="Terms of Service"
    summary="The terms you accept by using the African Youth Observatory, including what our data can and cannot be relied on for."
    sections={SECTIONS}
  />
);

export default TermsOfService;
