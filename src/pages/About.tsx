
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-muted/30 py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold">About the Platform</h1>
              <p className="text-muted-foreground">
                Learn more about the African Youth Statistical Database.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-8">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-4">
                  The African Youth Statistical Database aims to provide a comprehensive, accessible, and reliable source of data on youth development across Africa. We believe that high-quality data is essential for evidence-based policy making and effective program design.
                </p>
                <p className="text-muted-foreground">
                  By centralizing youth statistics from across the continent, we support researchers, policy makers, development organizations, and young people themselves in understanding and addressing the challenges and opportunities facing African youth.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground mb-4">
                  We envision a future where accurate, timely, and accessible data on African youth informs policies and programs that unlock the full potential of young Africans. Through better data and evidence, we aim to support the achievement of sustainable development goals and the African Union's Agenda 2063.
                </p>
                <p className="text-muted-foreground">
                  Our platform seeks to become the premier resource for youth-focused statistical information in Africa, driving innovation, research, and effective interventions.
                </p>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Target Audiences</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-bold mb-2">Policy Makers</h3>
                    <p className="text-muted-foreground">
                      Government officials at national and regional levels who need reliable data to design and evaluate youth policies and programs.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Researchers & Academia</h3>
                    <p className="text-muted-foreground">
                      Scholars and research institutions studying youth development trends, demographic patterns, and social issues affecting young Africans.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Development Partners</h3>
                    <p className="text-muted-foreground">
                      International organizations, NGOs, and foundations working on youth-focused development initiatives across Africa.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Private Sector</h3>
                    <p className="text-muted-foreground">
                      Businesses and entrepreneurs seeking market intelligence and insights on the youth demographic in African countries.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Media & Journalists</h3>
                    <p className="text-muted-foreground">
                      Media professionals reporting on youth issues who need accurate data and statistics to support their stories.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Young People</h3>
                    <p className="text-muted-foreground">
                      Young Africans seeking information about their demographic and understanding broader trends affecting their generation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Data Methodology</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2">Data Sources</h3>
                    <p className="text-muted-foreground">
                      Our database integrates information from multiple trusted sources, including:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-muted-foreground">
                      <li>National statistical offices and government agencies</li>
                      <li>International organizations (UN agencies, World Bank, African Development Bank)</li>
                      <li>Academic research and surveys</li>
                      <li>Specialized youth surveys and studies</li>
                      <li>Administrative data from education, health, and employment ministries</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">Quality Assurance</h3>
                    <p className="text-muted-foreground">
                      We employ a rigorous quality assurance process to ensure data accuracy and reliability:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-muted-foreground">
                      <li>Data validation and cross-checking with multiple sources</li>
                      <li>Standardization of indicators and definitions across countries</li>
                      <li>Regular updates and time-series maintenance</li>
                      <li>Transparent metadata and source documentation</li>
                      <li>Expert review of methodologies and calculations</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">Data Gaps & Limitations</h3>
                    <p className="text-muted-foreground">
                      We acknowledge several challenges in youth data collection across Africa:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-muted-foreground">
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
          
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Our Partners</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                  <div className="h-20 w-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground font-semibold">
                    Partner Logo
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
