import type { CmsRegistryEntry } from '../registry';

const PAGE = 'contact';

export const contactEntries: CmsRegistryEntry[] = [
  // Email card
  { key: 'contact.email.card_title', page: PAGE, section: 'email_card', contentType: 'TEXT', defaultContent: 'Email' },
  { key: 'contact.email.general_label', page: PAGE, section: 'email_card', contentType: 'TEXT', defaultContent: 'General Inquiries:' },
  { key: 'contact.email.info', page: PAGE, section: 'email_card', contentType: 'TEXT', defaultContent: 'info@africanyouthdata.org' },
  { key: 'contact.email.data_label', page: PAGE, section: 'email_card', contentType: 'TEXT', defaultContent: 'Data Requests:' },
  { key: 'contact.email.data', page: PAGE, section: 'email_card', contentType: 'TEXT', defaultContent: 'data@africanyouthdata.org' },
  { key: 'contact.email.partnerships_label', page: PAGE, section: 'email_card', contentType: 'TEXT', defaultContent: 'Partnerships:' },
  { key: 'contact.email.partnerships', page: PAGE, section: 'email_card', contentType: 'TEXT', defaultContent: 'partnerships@africanyouthdata.org' },

  // Organization card
  { key: 'contact.org.card_title', page: PAGE, section: 'org_card', contentType: 'TEXT', defaultContent: 'Organization' },
  { key: 'contact.org.primary_name', page: PAGE, section: 'org_card', contentType: 'TEXT', defaultContent: 'PACSDA' },
  { key: 'contact.org.primary_desc', page: PAGE, section: 'org_card', contentType: 'TEXT', defaultContent: 'Pan-African Centre for Statistics and Data Analytics' },
  { key: 'contact.org.partner_label', page: PAGE, section: 'org_card', contentType: 'TEXT', defaultContent: 'Implementing Partner:' },
  { key: 'contact.org.partner_name', page: PAGE, section: 'org_card', contentType: 'TEXT', defaultContent: 'ZeroUp Next' },

  // Response card
  { key: 'contact.response.card_title', page: PAGE, section: 'response_card', contentType: 'TEXT', defaultContent: 'Response Time' },
  { key: 'contact.response.body_p1', page: PAGE, section: 'response_card', contentType: 'RICH_TEXT', defaultContent: 'We typically respond to inquiries within 2-3 business days.' },
  { key: 'contact.response.body_p2', page: PAGE, section: 'response_card', contentType: 'RICH_TEXT', defaultContent: 'For urgent data requests, please indicate in your subject line.' },

  // Social card
  { key: 'contact.social.card_title', page: PAGE, section: 'social_card', contentType: 'TEXT', defaultContent: 'Connect With Us' },

  // Form
  { key: 'contact.form.card_title', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Send us a Message' },
  { key: 'contact.form.name_label', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Full Name *' },
  { key: 'contact.form.email_label', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Email Address *' },
  { key: 'contact.form.org_label', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Organization' },
  { key: 'contact.form.type_label', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Inquiry Type *' },
  { key: 'contact.form.type_placeholder', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Select inquiry type' },
  { key: 'contact.form.type.general', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'General Inquiry' },
  { key: 'contact.form.type.data_request', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Data Request' },
  { key: 'contact.form.type.partnership', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Partnership Opportunity' },
  { key: 'contact.form.type.technical', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Technical Support' },
  { key: 'contact.form.type.media', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Media Inquiry' },
  { key: 'contact.form.type.feedback', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Feedback' },
  { key: 'contact.form.subject_label', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Subject *' },
  { key: 'contact.form.message_label', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Message *' },
  { key: 'contact.form.submit', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Send Message' },
  { key: 'contact.form.required_hint', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: '* Required fields' },
  { key: 'contact.form.toast.title', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: 'Message Sent' },
  { key: 'contact.form.toast.description', page: PAGE, section: 'form', contentType: 'TEXT', defaultContent: "Thank you for contacting us. We'll respond within 2-3 business days." },
];
