
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CountryProfileProps {
  country: string;
}

const CountryProfile = ({ country }: CountryProfileProps) => {
  return (
    <div className="container px-4 md:px-6 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{country}</h1>
          <p className="text-muted-foreground">Youth Profile Overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Download Profile
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <ExternalLink className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-3">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-4">Demographic Overview</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-muted-foreground">Total Youth Population</p>
                    <p className="text-2xl font-bold">12.4M</p>
                    <p className="text-xs text-muted-foreground">Ages 15-24</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-muted-foreground">Youth as % of Population</p>
                    <p className="text-2xl font-bold">21.3%</p>
                    <p className="text-xs text-muted-foreground">National average: 20.4%</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-muted-foreground">Urban Youth</p>
                    <p className="text-2xl font-bold">58.7%</p>
                    <p className="text-xs text-muted-foreground">+3.2% since 2018</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-muted-foreground">Gender Ratio</p>
                    <p className="text-2xl font-bold">102:100</p>
                    <p className="text-xs text-muted-foreground">Males to females</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="h-[200px] border rounded-md bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Population Pyramid</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Youth population pyramid for {country}, 2023
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="population" className="mt-6">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="population">Population</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="entrepreneurship">Entrepreneurship</TabsTrigger>
        </TabsList>
        
        <TabsContent value="population" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Youth Population Trends</h3>
              <div className="chart-container border border-dashed rounded-md bg-background p-4 flex items-center justify-center mb-4">
                <div className="w-full h-full">
                  {/* Simplified chart */}
                  <div className="w-full h-full flex items-end justify-around">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-6 bg-pan-green-500 hover:bg-pan-green-600 transition-all rounded-t-md relative group"
                        style={{ height: `${40 + Math.random() * 40}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs py-1 px-2 rounded transition-opacity">
                          {2014 + i}: {10 + Math.floor(Math.random() * 4)}M
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between">
                    <span className="text-xs text-muted-foreground">2014</span>
                    <span className="text-xs text-muted-foreground">2023</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Key Statistics</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Annual growth rate:</span>
                      <span className="font-medium">2.1%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Projected youth population (2030):</span>
                      <span className="font-medium">15.8 million</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Youth dependency ratio:</span>
                      <span className="font-medium">43.2%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Youth migration rate:</span>
                      <span className="font-medium">+1.3%</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Regional Distribution</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Central region:</span>
                      <span className="font-medium">32.4%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Eastern region:</span>
                      <span className="font-medium">26.7%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Northern region:</span>
                      <span className="font-medium">18.5%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Southern region:</span>
                      <span className="font-medium">22.4%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Population Analysis</h3>
              <p className="text-muted-foreground mb-4">
                The youth population in {country} has been growing steadily over the past decade, with a slight acceleration in urban areas. Migration from rural to urban centers continues to shape the youth demographic landscape, with education and employment opportunities being the primary drivers.
              </p>
              <p className="text-muted-foreground">
                Gender distribution remains relatively balanced, though regional variations exist. The central region has the highest concentration of youth, primarily due to educational institutions and economic opportunities in urban centers.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Education Indicators</h3>
              <div className="chart-container border border-dashed rounded-md bg-background p-4 flex items-center justify-center mb-4">
                <p className="text-muted-foreground">Education data visualization</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Key Statistics</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Youth literacy rate:</span>
                      <span className="font-medium">82.4%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Secondary enrollment:</span>
                      <span className="font-medium">71.2%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Tertiary enrollment:</span>
                      <span className="font-medium">18.7%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Secondary completion:</span>
                      <span className="font-medium">65.3%</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Gender Analysis</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Female literacy:</span>
                      <span className="font-medium">79.8%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Male literacy:</span>
                      <span className="font-medium">85.1%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Gender parity (secondary):</span>
                      <span className="font-medium">0.92</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Gender parity (tertiary):</span>
                      <span className="font-medium">0.87</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Health Indicators</h3>
              <div className="chart-container border border-dashed rounded-md bg-background p-4 flex items-center justify-center mb-4">
                <p className="text-muted-foreground">Health data visualization</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Key Statistics</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Access to healthcare:</span>
                      <span className="font-medium">68.7%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">HIV prevalence (15-24):</span>
                      <span className="font-medium">2.1%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Mental health coverage:</span>
                      <span className="font-medium">31.4%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Youth health insurance:</span>
                      <span className="font-medium">42.8%</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Health Services</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Youth-friendly health centers:</span>
                      <span className="font-medium">183</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Mental health facilities:</span>
                      <span className="font-medium">72</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Reproductive health clinics:</span>
                      <span className="font-medium">256</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Health expenditure per youth:</span>
                      <span className="font-medium">$42 USD</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="employment" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Employment Indicators</h3>
              <div className="chart-container border border-dashed rounded-md bg-background p-4 flex items-center justify-center mb-4">
                <p className="text-muted-foreground">Employment data visualization</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Key Statistics</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Youth unemployment rate:</span>
                      <span className="font-medium">18.3%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Labor force participation:</span>
                      <span className="font-medium">42.1%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Informal employment:</span>
                      <span className="font-medium">67.8%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">NEET rate:</span>
                      <span className="font-medium">23.4%</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Industry Distribution</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Services:</span>
                      <span className="font-medium">41.2%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Agriculture:</span>
                      <span className="font-medium">28.7%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Manufacturing:</span>
                      <span className="font-medium">14.3%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Technology/ICT:</span>
                      <span className="font-medium">9.8%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="entrepreneurship" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Entrepreneurship Indicators</h3>
              <div className="chart-container border border-dashed rounded-md bg-background p-4 flex items-center justify-center mb-4">
                <p className="text-muted-foreground">Entrepreneurship data visualization</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Key Statistics</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Youth business ownership:</span>
                      <span className="font-medium">12.4%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Startup formation rate:</span>
                      <span className="font-medium">3.7%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Access to startup capital:</span>
                      <span className="font-medium">21.3%</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">5-year business survival:</span>
                      <span className="font-medium">32.8%</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Entrepreneurship Support</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Incubators/accelerators:</span>
                      <span className="font-medium">28</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Youth innovation hubs:</span>
                      <span className="font-medium">42</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Entrepreneurship programs:</span>
                      <span className="font-medium">67</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Youth investment funds:</span>
                      <span className="font-medium">$12.3M USD</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CountryProfile;
