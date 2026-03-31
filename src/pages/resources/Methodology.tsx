import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Database, Shield, Calculator, RefreshCw, CheckCircle } from 'lucide-react';

const Methodology = () => {
  return (
    <>
      <header className="gradient-hero py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="section-title">Methodology</h1>
          </div>
          <p className="section-description">
            Understand how we collect, process, and validate youth data across Africa.
          </p>
        </div>
      </header>

      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Data Collection Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  The African Youth Database aggregates youth-focused statistics from a diverse range of authoritative sources. 
                  Our data collection methodology is designed to ensure comprehensiveness, accuracy, and comparability across 
                  all 54 African countries.
                </p>
                <h4 className="text-foreground font-semibold mt-4">Primary Data Sources</h4>
                <ul className="space-y-2">
                  <li><strong>National Statistical Offices:</strong> Census data, labor force surveys, household surveys</li>
                  <li><strong>UN Agencies:</strong> UNDP Human Development Reports, UNESCO education statistics, ILO labor data, UNICEF surveys</li>
                  <li><strong>World Bank:</strong> World Development Indicators, Enterprise Surveys</li>
                  <li><strong>African Development Bank:</strong> African Economic Outlook, African Statistical Yearbook</li>
                  <li><strong>DHS Program:</strong> Demographic and Health Surveys</li>
                  <li><strong>Academic Research:</strong> Peer-reviewed studies and specialized youth surveys</li>
                </ul>
              </CardContent>
            </Card>

            {/* Standardization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Standardization Process
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  To enable cross-country comparison, we apply rigorous standardization procedures:
                </p>
                <h4 className="text-foreground font-semibold mt-4">Age Definition</h4>
                <p>
                  We standardize all youth indicators to the 15-24 age group, consistent with the UN definition. 
                  Where source data uses different age brackets (e.g., 18-35 for African Union definition), 
                  we note this in metadata and apply statistical adjustments where possible.
                </p>
                
                <h4 className="text-foreground font-semibold mt-4">Indicator Harmonization</h4>
                <ul className="space-y-1">
                  <li>Standardized indicator definitions aligned with international statistical standards</li>
                  <li>Consistent calculation methodologies across countries</li>
                  <li>Currency conversions to USD using World Bank exchange rates</li>
                  <li>PPP adjustments for economic comparisons where appropriate</li>
                </ul>

                <h4 className="text-foreground font-semibold mt-4">Temporal Alignment</h4>
                <p>
                  Data points are aligned to calendar years. Multi-year surveys are assigned to the midpoint year. 
                  When the latest data is not available for a country, we display the most recent available year 
                  with clear vintage labeling.
                </p>
              </CardContent>
            </Card>

            {/* Quality Assurance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Quality Assurance
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  Every dataset undergoes a multi-stage quality assurance process:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mt-4 not-prose">
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-semibold text-foreground mb-2">1. Source Verification</h5>
                    <p className="text-sm">Confirm data origin from official or peer-reviewed sources. Verify methodology documentation is available.</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-semibold text-foreground mb-2">2. Data Validation</h5>
                    <p className="text-sm">Cross-check values against multiple sources. Flag outliers for manual review.</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-semibold text-foreground mb-2">3. Consistency Checks</h5>
                    <p className="text-sm">Verify temporal consistency (no illogical year-over-year changes). Check against related indicators.</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-semibold text-foreground mb-2">4. Credibility Scoring</h5>
                    <p className="text-sm">Assign 1-5 star rating based on source reliability, methodology rigor, and recency.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* African Youth Index */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  African Youth Index Methodology
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  The African Youth Index (AYI) is a composite indicator developed by AYD to provide a comprehensive 
                  measure of youth development across African countries.
                </p>
                
                <h4 className="text-foreground font-semibold mt-4">Dimensions & Indicators</h4>
                <div className="not-prose overflow-x-auto">
                  <table className="min-w-full text-sm mt-2">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold text-foreground">Dimension</th>
                        <th className="text-left py-2 font-semibold text-foreground">Weight</th>
                        <th className="text-left py-2 font-semibold text-foreground">Key Indicators</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2">Education</td>
                        <td className="py-2">25%</td>
                        <td className="py-2">Literacy rate, enrollment, completion rates, gender parity</td>
                      </tr>
                      <tr>
                        <td className="py-2">Employment</td>
                        <td className="py-2">30%</td>
                        <td className="py-2">Unemployment, NEET rate, labor participation, formality</td>
                      </tr>
                      <tr>
                        <td className="py-2">Health</td>
                        <td className="py-2">25%</td>
                        <td className="py-2">Healthcare access, mental health, nutrition, mortality</td>
                      </tr>
                      <tr>
                        <td className="py-2">Civic Engagement</td>
                        <td className="py-2">20%</td>
                        <td className="py-2">Political participation, volunteering, digital inclusion</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="text-foreground font-semibold mt-4">Calculation Method</h4>
                <ol className="space-y-1">
                  <li>Normalize all indicators to 0-100 scale using min-max normalization</li>
                  <li>Calculate dimension scores as weighted average of constituent indicators</li>
                  <li>Compute overall AYI as weighted sum of dimension scores</li>
                  <li>Rank countries from highest to lowest AYI score</li>
                </ol>
              </CardContent>
            </Card>

            {/* Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  Data Updates & Version Control
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  We maintain a systematic approach to data updates and version control:
                </p>
                <ul className="space-y-2">
                  <li><strong>Annual Updates:</strong> Core indicators are reviewed and updated annually when new source data is released</li>
                  <li><strong>Continuous Monitoring:</strong> We track major data releases from key sources and integrate promptly</li>
                  <li><strong>Version History:</strong> All datasets maintain version history showing changes over time</li>
                  <li><strong>Changelog:</strong> Material changes to methodology are documented and communicated to users</li>
                  <li><strong>API Versioning:</strong> Premium API users have access to version-specific endpoints for reproducibility</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Methodology;
