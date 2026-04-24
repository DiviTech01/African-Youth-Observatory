import type { CmsRegistryEntry } from '../registry';

const PAGE = 'about';

export const aboutEntries: CmsRegistryEntry[] = [
  { key: 'about.mission.title', page: PAGE, section: 'mission', contentType: 'TEXT', defaultContent: 'Our Mission' },
  { key: 'about.mission.body_p1', page: PAGE, section: 'mission', contentType: 'RICH_TEXT', defaultContent: 'The African Youth Statistical Database aims to provide a comprehensive, accessible, and reliable source of data on youth development across Africa. We believe that high-quality data is essential for evidence-based policy making and effective program design.' },
  { key: 'about.mission.body_p2', page: PAGE, section: 'mission', contentType: 'RICH_TEXT', defaultContent: 'By centralizing youth statistics from across the continent, we support researchers, policy makers, development organizations, and young people themselves in understanding and addressing the challenges and opportunities facing African youth.' },

  { key: 'about.vision.title', page: PAGE, section: 'vision', contentType: 'TEXT', defaultContent: 'Our Vision' },
  { key: 'about.vision.body_p1', page: PAGE, section: 'vision', contentType: 'RICH_TEXT', defaultContent: "We envision a future where accurate, timely, and accessible data on African youth informs policies and programs that unlock the full potential of young Africans. Through better data and evidence, we aim to support the achievement of sustainable development goals and the African Union's Agenda 2063." },
  { key: 'about.vision.body_p2', page: PAGE, section: 'vision', contentType: 'RICH_TEXT', defaultContent: 'Our platform seeks to become the premier resource for youth-focused statistical information in Africa, driving innovation, research, and effective interventions.' },

  { key: 'about.audiences.title', page: PAGE, section: 'audiences', contentType: 'TEXT', defaultContent: 'Target Audiences' },
  { key: 'about.audiences.policy_makers.title', page: PAGE, section: 'audiences', contentType: 'TEXT', defaultContent: 'Policy Makers' },
  { key: 'about.audiences.policy_makers.description', page: PAGE, section: 'audiences', contentType: 'RICH_TEXT', defaultContent: 'Government officials at national and regional levels who need reliable data to design and evaluate youth policies and programs.' },
  { key: 'about.audiences.researchers.title', page: PAGE, section: 'audiences', contentType: 'TEXT', defaultContent: 'Researchers & Academia' },
  { key: 'about.audiences.researchers.description', page: PAGE, section: 'audiences', contentType: 'RICH_TEXT', defaultContent: 'Scholars and research institutions studying youth development trends, demographic patterns, and social issues affecting young Africans.' },
  { key: 'about.audiences.partners.title', page: PAGE, section: 'audiences', contentType: 'TEXT', defaultContent: 'Development Partners' },
  { key: 'about.audiences.partners.description', page: PAGE, section: 'audiences', contentType: 'RICH_TEXT', defaultContent: 'International organizations, NGOs, and foundations working on youth-focused development initiatives across Africa.' },
  { key: 'about.audiences.private_sector.title', page: PAGE, section: 'audiences', contentType: 'TEXT', defaultContent: 'Private Sector' },
  { key: 'about.audiences.private_sector.description', page: PAGE, section: 'audiences', contentType: 'RICH_TEXT', defaultContent: 'Businesses and entrepreneurs seeking market intelligence and insights on the youth demographic in African countries.' },
  { key: 'about.audiences.media.title', page: PAGE, section: 'audiences', contentType: 'TEXT', defaultContent: 'Media & Journalists' },
  { key: 'about.audiences.media.description', page: PAGE, section: 'audiences', contentType: 'RICH_TEXT', defaultContent: 'Media professionals reporting on youth issues who need accurate data and statistics to support their stories.' },
  { key: 'about.audiences.young_people.title', page: PAGE, section: 'audiences', contentType: 'TEXT', defaultContent: 'Young People' },
  { key: 'about.audiences.young_people.description', page: PAGE, section: 'audiences', contentType: 'RICH_TEXT', defaultContent: 'Young Africans seeking information about their demographic and understanding broader trends affecting their generation.' },

  { key: 'about.methodology.title', page: PAGE, section: 'methodology', contentType: 'TEXT', defaultContent: 'Data Methodology' },
  { key: 'about.methodology.sources.title', page: PAGE, section: 'methodology', contentType: 'TEXT', defaultContent: 'Data Sources' },
  { key: 'about.methodology.sources.body', page: PAGE, section: 'methodology', contentType: 'RICH_TEXT', defaultContent: '<p>Our database integrates information from multiple trusted sources, including:</p><ul><li>National statistical offices and government agencies</li><li>International organizations (UN agencies, World Bank, African Development Bank)</li><li>Academic research and surveys</li><li>Specialized youth surveys and studies</li><li>Administrative data from education, health, and employment ministries</li></ul>' },
  { key: 'about.methodology.quality.title', page: PAGE, section: 'methodology', contentType: 'TEXT', defaultContent: 'Quality Assurance' },
  { key: 'about.methodology.quality.body', page: PAGE, section: 'methodology', contentType: 'RICH_TEXT', defaultContent: '<p>We employ a rigorous quality assurance process to ensure data accuracy and reliability:</p><ul><li>Data validation and cross-checking with multiple sources</li><li>Standardization of indicators and definitions across countries</li><li>Regular updates and time-series maintenance</li><li>Transparent metadata and source documentation</li><li>Expert review of methodologies and calculations</li></ul>' },
  { key: 'about.methodology.gaps.title', page: PAGE, section: 'methodology', contentType: 'TEXT', defaultContent: 'Data Gaps & Limitations' },
  { key: 'about.methodology.gaps.body', page: PAGE, section: 'methodology', contentType: 'RICH_TEXT', defaultContent: '<p>We acknowledge several challenges in youth data collection across Africa:</p><ul><li>Limited frequency of national surveys in some countries</li><li>Variations in definitions and age classifications</li><li>Under-coverage of youth in fragile and conflict-affected areas</li><li>Gaps in disaggregated data by gender, location, and other factors</li><li>Emerging issues with limited historical data (e.g., digital access)</li></ul>' },

  { key: 'about.partners.title', page: PAGE, section: 'partners', contentType: 'TEXT', defaultContent: 'Our Partners' },
];
