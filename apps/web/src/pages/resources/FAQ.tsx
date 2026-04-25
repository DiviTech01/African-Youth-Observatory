import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Database, Download, Lock, Users, BarChart } from 'lucide-react';

const faqCategories = [
  {
    title: "About the Platform",
    icon: Database,
    questions: [
      {
        question: "What is the African Youth Observatory (AYD)?",
        answer: "The African Youth Observatory is Africa's most comprehensive youth data intelligence platform. It centralizes, analyzes, and visualizes youth-related statistics across all 54 African countries, covering population, education, health, employment, and entrepreneurship. Our mission is to power policy, research, innovation, and investment decisions with trusted, accessible data."
      },
      {
        question: "Who manages and maintains the AYD?",
        answer: "AYD is managed by PACSDA (Pan-African Centre for Statistics and Data Analytics) with implementation support from ZeroUp Next. We collaborate with national statistical offices, international organizations (UN agencies, World Bank, African Development Bank), and research institutions across Africa."
      },
      {
        question: "How often is the data updated?",
        answer: "Data update frequency varies by indicator and source. Most core indicators are updated annually when new national or international survey data becomes available. Real-time indicators may be updated more frequently. Each dataset includes metadata showing the last update date and data vintage."
      },
      {
        question: "Which countries are covered?",
        answer: "AYD covers all 54 African Union member states. Coverage depth varies by country and indicator based on data availability. We continuously work with national partners to expand coverage and improve data quality."
      }
    ]
  },
  {
    title: "Using the Data",
    icon: BarChart,
    questions: [
      {
        question: "How do I search and filter data?",
        answer: "Use our Data Explorer to browse data by country, theme (Population, Education, Health, Employment, Entrepreneurship), indicator, year, gender, and age group. The interactive map allows you to click on countries to view their profiles. You can also use the Compare Countries feature to analyze up to 5 countries side by side."
      },
      {
        question: "What is the African Youth Index (AYI)?",
        answer: "The AYI is our flagship composite indicator that ranks all African countries based on youth development outcomes. It combines scores across education, employment, health, and civic engagement to provide a comprehensive measure of how well countries are supporting their youth population. Countries are ranked annually."
      },
      {
        question: "Can I download the data?",
        answer: "Yes! All public datasets can be downloaded in multiple formats including CSV, Excel (XLSX), and PDF. Charts can be exported as PNG images. Premium API access provides programmatic access to raw data for advanced users and applications."
      },
      {
        question: "Can I embed charts in my website or report?",
        answer: "Yes, our charts support embedding. Click the 'Embed' button on any visualization to get an embed code. Please ensure you attribute the African Youth Observatory as the source and link back to the original data page."
      }
    ]
  },
  {
    title: "Data Quality & Sources",
    icon: Lock,
    questions: [
      {
        question: "Where does the data come from?",
        answer: "Our data comes from multiple verified sources including: national statistical offices and census bureaus, UN agencies (UNDP, UNICEF, UNESCO, ILO), World Bank, African Development Bank, Demographic and Health Surveys (DHS), academic research, and specialized youth surveys. Each dataset includes full source attribution and methodology notes."
      },
      {
        question: "How do you ensure data quality?",
        answer: "We implement a rigorous quality assurance process: data validation and cross-checking with multiple sources, standardization of indicators across countries, credibility scoring for each dataset, human review of all AI-generated insights, and transparent documentation of methodology and limitations."
      },
      {
        question: "What is the Credibility Score?",
        answer: "Each dataset receives a Credibility Score (1-5 stars) based on: source reliability, methodology rigor, data recency, sample representativeness, and verification status. Higher scores indicate greater confidence in data accuracy. Datasets below 3 stars include advisory notes."
      },
      {
        question: "Are there data gaps or limitations I should know about?",
        answer: "Yes, we maintain transparency about data limitations. Common challenges include: varying definitions of 'youth' across countries, limited data from fragile and conflict-affected states, gaps in disaggregated data (by gender, disability, etc.), and lag between data collection and publication. Each indicator page notes specific limitations."
      }
    ]
  },
  {
    title: "Access & Permissions",
    icon: Users,
    questions: [
      {
        question: "Is the platform free to use?",
        answer: "Yes, core platform features are free for all users. This includes browsing dashboards, viewing visualizations, downloading standard datasets, and accessing the African Youth Index. Premium features (API access, custom dashboards, advanced analytics) require registration or subscription."
      },
      {
        question: "Do I need to create an account?",
        answer: "No account is needed for basic browsing. However, registered users can: save custom dashboards, set up data alerts, access download history, use the API, and contribute datasets. Registration is free for researchers and institutions."
      },
      {
        question: "Can I use AYD data in my research or publications?",
        answer: "Yes! We encourage the use of AYD data for research, policy analysis, and journalism. Please cite the African Youth Observatory as your source and include a link to the specific dataset or page. For academic citations, use our suggested citation format available on each data page."
      },
      {
        question: "How can my organization contribute data?",
        answer: "We welcome data contributions from national statistical offices, research institutions, and development organizations. Contributors must: register through our Partner Portal, submit datasets with full metadata and methodology, undergo a verification review, and sign a data sharing agreement. Contributors receive attribution and impact metrics."
      }
    ]
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <header className="gradient-hero py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="section-title">Frequently Asked Questions</h1>
          </div>
          <p className="section-description">
            Find answers to common questions about the African Youth Observatory.
          </p>
        </div>
      </header>

      <main className="flex-grow py-6 md:py-8">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {faqCategories.map((category, catIndex) => (
              <section key={catIndex}>
                <div className="flex items-center gap-2 mb-4">
                  <category.icon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">{category.title}</h2>
                </div>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((item, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${catIndex}-${index}`}
                      className="border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="text-left text-sm md:text-base font-medium hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>

          <div className="max-w-4xl mx-auto mt-12 p-6 bg-muted/50 rounded-lg text-center">
            <h3 className="font-bold text-lg mb-2">Still have questions?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Can't find the answer you're looking for? Our team is here to help.
            </p>
            <a href="/contact" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
