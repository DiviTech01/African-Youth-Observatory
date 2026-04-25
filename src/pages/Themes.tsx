
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, Heart, Briefcase, BookOpen, Vote, Lightbulb, Wheat, Scale } from 'lucide-react';
import { Content } from '@/components/cms';

const themes = [
  { id: 'population', title: 'Population', description: 'Youth demographics, trends, and projections across African nations.', icon: Users, color: 'green', stats: [ { slug: 'total', label: 'Total Youth Population', value: '226M' }, { slug: 'growth', label: 'Annual Growth Rate', value: '2.3%' }, { slug: 'urban', label: 'Urban Youth', value: '43%' } ] },
  { id: 'education', title: 'Education', description: 'Educational attainment, enrollment rates, and quality metrics for African youth.', icon: GraduationCap, color: 'blue', stats: [ { slug: 'literacy', label: 'Literacy Rate', value: '73.4%' }, { slug: 'secondary', label: 'Secondary Enrollment', value: '62.7%' }, { slug: 'tertiary', label: 'Tertiary Enrollment', value: '17.8%' } ] },
  { id: 'health', title: 'Health', description: 'Health access, outcomes, and risk factors affecting African youth.', icon: Heart, color: 'purple', stats: [ { slug: 'access', label: 'Healthcare Access', value: '67.2%' }, { slug: 'insurance', label: 'Health Insurance Coverage', value: '38.5%' }, { slug: 'mental', label: 'Mental Health Services', value: '27.3%' } ] },
  { id: 'employment', title: 'Employment', description: 'Labor market participation, unemployment, and work conditions for young Africans.', icon: Briefcase, color: 'orange', stats: [ { slug: 'unemployment', label: 'Youth Unemployment', value: '19.7%' }, { slug: 'participation', label: 'Labor Participation', value: '41.3%' }, { slug: 'informal', label: 'Informal Employment', value: '72.8%' } ] },
  { id: 'entrepreneurship', title: 'Entrepreneurship', description: 'Startup ecosystems, business ownership, and innovation among African youth.', icon: BookOpen, color: 'green', stats: [ { slug: 'ownership', label: 'Business Ownership', value: '12.6%' }, { slug: 'finance', label: 'Access to Finance', value: '23.4%' }, { slug: 'startup', label: 'Startup Formation', value: '3.2%' } ] },
  { id: 'civic-engagement', title: 'Civic Engagement', description: 'Youth participation in governance, civic processes, and civil society across Africa.', icon: Vote, color: 'red', stats: [ { slug: 'voter', label: 'Voter Registration (Youth)', value: '42.8%' }, { slug: 'parliament', label: 'Youth in Parliament', value: '3.2%' }, { slug: 'cso', label: 'Civil Society Orgs', value: '12,400+' } ] },
  { id: 'innovation-technology', title: 'Innovation & Technology', description: 'Digital access, STEM participation, and technological innovation among African youth.', icon: Lightbulb, color: 'blue', stats: [ { slug: 'internet', label: 'Internet Penetration', value: '33.8%' }, { slug: 'mobile', label: 'Mobile Ownership', value: '67.2%' }, { slug: 'stem', label: 'STEM Enrollment', value: '14.5%' } ] },
  { id: 'agriculture', title: 'Agriculture', description: 'Youth involvement in agriculture, land access, and food production across the continent.', icon: Wheat, color: 'green', stats: [ { slug: 'youth_in_ag', label: 'Youth in Agriculture', value: '28.4%' }, { slug: 'land', label: 'Arable Land Access', value: '12.1%' }, { slug: 'productivity', label: 'Productivity Index', value: '62.3' } ] },
  { id: 'gender-equality', title: 'Gender Equality', description: 'Gender parity in education, workforce participation, and safety for African youth.', icon: Scale, color: 'purple', stats: [ { slug: 'gpi_edu', label: 'GPI Education', value: '0.94' }, { slug: 'workforce', label: 'Women in Workforce', value: '38.7%' }, { slug: 'gbv', label: 'GBV Prevalence', value: '21.3%' } ] },
];

const themeSlug = (id: string) => id.replace(/-/g, '_');

const Themes = () => {
  const { t } = useLanguage();
  return (
    <>
      <div className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">{t('themes.title')}</h1>
              <p className="text-sm sm:text-base text-[#A89070]">{t('themes.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          <div className="grid gap-4 md:gap-6 lg:gap-8">
            {themes.map((theme) => {
              const slug = themeSlug(theme.id);
              return (
                <Card key={theme.id} className={`border-l-4 border-l-pan-${theme.color}-500 bg-white/[0.03] border-gray-800 rounded-2xl`}>
                  <CardContent className="p-4 md:p-6">
                    <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                          <div className={`p-1.5 md:p-2 rounded-md bg-pan-${theme.color}-100 text-pan-${theme.color}-500`}>
                            <theme.icon className="h-5 w-5 md:h-6 md:w-6" />
                          </div>
                          <Content as="h2" id={`themes.${slug}.title`} fallback={theme.title} className="text-xl sm:text-2xl font-bold" />
                        </div>

                        <Content
                          as="p"
                          id={`themes.${slug}.description`}
                          fallback={theme.description}
                          className="text-sm sm:text-base text-gray-400 mb-4 md:mb-6"
                        />

                        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                          {theme.stats.map((stat) => (
                            <div key={stat.slug} className={`p-2 md:p-3 rounded-md bg-pan-${theme.color}-50`}>
                              <Content
                                as="p"
                                id={`themes.${slug}.stat.${stat.slug}.label`}
                                fallback={stat.label}
                                className="text-[10px] sm:text-xs md:text-sm text-gray-400 line-clamp-1"
                              />
                              <p className="text-base sm:text-lg md:text-xl font-bold">{stat.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link to={`/explore?theme=${theme.id}`}>
                            <Button size="sm" className="text-xs sm:text-sm">
                              <Content as="span" id="themes.cta.explore" fallback="Explore Data" />
                            </Button>
                          </Link>
                          <Link to={`/explore?theme=${theme.id}`}>
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                              <Content as="span" id="themes.cta.indicators" fallback="View Indicators" />
                            </Button>
                          </Link>
                          <Link to={`/compare?theme=${theme.id}`}>
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                              <Content as="span" id="themes.cta.compare" fallback="Compare Countries" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="hidden md:block md:col-span-1">
                        <div className={`h-full min-h-[200px] rounded-md bg-pan-${theme.color}-50 flex items-center justify-center p-4 md:p-6`}>
                          <div className="w-full aspect-square relative">
                            {theme.id === 'population' && (
                              <div className="w-full h-full flex items-end justify-around">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-8 md:w-12 bg-pan-${theme.color}-${300 + i * 50} hover:bg-pan-${theme.color}-${400 + i * 50} transition-all rounded-t-md`}
                                    style={{ height: `${40 + Math.random() * 50}%` }}
                                  ></div>
                                ))}
                              </div>
                            )}
                            {theme.id === 'education' && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-8 border-pan-blue-300 flex items-center justify-center">
                                  <span className="text-xl md:text-2xl font-bold text-pan-blue-500">73%</span>
                                </div>
                              </div>
                            )}
                            {theme.id === 'health' && <div className="w-full h-full flex items-center justify-center"><Heart className="w-24 h-24 md:w-32 md:h-32 text-pan-purple-300" /></div>}
                            {theme.id === 'employment' && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-8 border-pan-orange-300 flex items-center justify-center relative">
                                  <span className="text-xl md:text-2xl font-bold text-pan-orange-500">42%</span>
                                  <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-pan-orange-500 flex items-center justify-center text-white font-bold">+</div>
                                </div>
                              </div>
                            )}
                            {theme.id === 'entrepreneurship' && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-2 md:gap-4">
                                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-md bg-pan-green-300"></div>
                                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-md bg-pan-green-400"></div>
                                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-md bg-pan-green-500"></div>
                                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-md bg-pan-green-600"></div>
                                </div>
                              </div>
                            )}
                            {theme.id === 'civic-engagement' && <div className="w-full h-full flex items-center justify-center"><Vote className="w-24 h-24 md:w-32 md:h-32 text-pan-red-300" /></div>}
                            {theme.id === 'innovation-technology' && <div className="w-full h-full flex items-center justify-center"><Lightbulb className="w-24 h-24 md:w-32 md:h-32 text-pan-blue-300" /></div>}
                            {theme.id === 'agriculture' && <div className="w-full h-full flex items-center justify-center"><Wheat className="w-24 h-24 md:w-32 md:h-32 text-pan-green-300" /></div>}
                            {theme.id === 'gender-equality' && <div className="w-full h-full flex items-center justify-center"><Scale className="w-24 h-24 md:w-32 md:h-32 text-pan-purple-300" /></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Themes;
