
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  const { t } = useLanguage();
  return (
    <>
      <div className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">{t('about.title')}</h1>
              <p className="text-sm sm:text-base text-[#A89070]">
                {t('about.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2">
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardContent className="p-4 md:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent mb-3 md:mb-4">Our Mission</h2>
                <p className="text-sm sm:text-base text-gray-400 mb-3 md:mb-4">
                  The African Youth Statistical Database aims to provide a comprehensive, accessible, and reliable source of data on youth development across Africa. We believe that high-quality data is essential for evidence-based policy making and effective program design.
                </p>
                <p className="text-sm sm:text-base text-gray-400">
                  By centralizing youth statistics from across the continent, we support researchers, policy makers, development organizations, and young people themselves in understanding and addressing the challenges and opportunities facing African youth.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardContent className="p-4 md:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent mb-3 md:mb-4">Our Vision</h2>
                <p className="text-sm sm:text-base text-gray-400 mb-3 md:mb-4">
                  We envision a future where accurate, timely, and accessible data on African youth informs policies and programs that unlock the full potential of young Africans. Through better data and evidence, we aim to support the achievement of sustainable development goals and the African Union's Agenda 2063.
                </p>
                <p className="text-sm sm:text-base text-gray-400">
                  Our platform seeks to become the premier resource for youth-focused statistical information in Africa, driving innovation, research, and effective interventions.
                </p>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardContent className="p-4 md:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent mb-3 md:mb-4">Target Audiences</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Policy Makers</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Government officials at national and regional levels who need reliable data to design and evaluate youth policies and programs.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Researchers & Academia</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Scholars and research institutions studying youth development trends, demographic patterns, and social issues affecting young Africans.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Development Partners</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      International organizations, NGOs, and foundations working on youth-focused development initiatives across Africa.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Private Sector</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Businesses and entrepreneurs seeking market intelligence and insights on the youth demographic in African countries.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Media & Journalists</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Media professionals reporting on youth issues who need accurate data and statistics to support their stories.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Young People</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Young Africans seeking information about their demographic and understanding broader trends affecting their generation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardContent className="p-4 md:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent mb-3 md:mb-4">Data Methodology</h2>
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Data Sources</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Our database integrates information from multiple trusted sources, including:
                    </p>
                    <ul className="list-disc pl-4 md:pl-5 mt-2 text-xs sm:text-sm text-gray-400 space-y-1">
                      <li>National statistical offices and government agencies</li>
                      <li>International organizations (UN agencies, World Bank, African Development Bank)</li>
                      <li>Academic research and surveys</li>
                      <li>Specialized youth surveys and studies</li>
                      <li>Administrative data from education, health, and employment ministries</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Quality Assurance</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      We employ a rigorous quality assurance process to ensure data accuracy and reliability:
                    </p>
                    <ul className="list-disc pl-4 md:pl-5 mt-2 text-xs sm:text-sm text-gray-400 space-y-1">
                      <li>Data validation and cross-checking with multiple sources</li>
                      <li>Standardization of indicators and definitions across countries</li>
                      <li>Regular updates and time-series maintenance</li>
                      <li>Transparent metadata and source documentation</li>
                      <li>Expert review of methodologies and calculations</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Data Gaps & Limitations</h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      We acknowledge several challenges in youth data collection across Africa:
                    </p>
                    <ul className="list-disc pl-4 md:pl-5 mt-2 text-xs sm:text-sm text-gray-400 space-y-1">
                      <li>Limited frequency of national surveys in some countries</li>
                      <li>Variations in definitions and age classifications</li>
                      <li>Under-coverage of youth in fragile and conflict-affected areas</li>
                      <li>Gaps in disaggregated data by gender, location, and other factors</li>
                      <li>Emerging issues with limited historical data (e.g., digital access)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 md:mt-12">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent mb-4 md:mb-6">Our Partners</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                  <div className="h-16 sm:h-20 w-full max-w-[160px] bg-white/[0.05] border border-gray-800 rounded-xl flex items-center justify-center text-gray-500 font-semibold text-xs sm:text-sm">
                    Partner Logo
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
