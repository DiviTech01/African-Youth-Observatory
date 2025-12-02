
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, Heart, Briefcase, BookOpen } from 'lucide-react';

const themes = [
  {
    id: "population",
    title: "Population",
    description: "Youth demographics, trends, and projections across African nations.",
    icon: Users,
    color: "green",
    stats: [
      { label: "Total Youth Population", value: "226M" },
      { label: "Annual Growth Rate", value: "2.3%" },
      { label: "Urban Youth", value: "43%" }
    ]
  },
  {
    id: "education",
    title: "Education",
    description: "Educational attainment, enrollment rates, and quality metrics for African youth.",
    icon: GraduationCap,
    color: "blue",
    stats: [
      { label: "Literacy Rate", value: "73.4%" },
      { label: "Secondary Enrollment", value: "62.7%" },
      { label: "Tertiary Enrollment", value: "17.8%" }
    ]
  },
  {
    id: "health",
    title: "Health",
    description: "Health access, outcomes, and risk factors affecting African youth.",
    icon: Heart,
    color: "purple",
    stats: [
      { label: "Healthcare Access", value: "67.2%" },
      { label: "Health Insurance Coverage", value: "38.5%" },
      { label: "Mental Health Services", value: "27.3%" }
    ]
  },
  {
    id: "employment",
    title: "Employment",
    description: "Labor market participation, unemployment, and work conditions for young Africans.",
    icon: Briefcase,
    color: "orange",
    stats: [
      { label: "Youth Unemployment", value: "19.7%" },
      { label: "Labor Participation", value: "41.3%" },
      { label: "Informal Employment", value: "72.8%" }
    ]
  },
  {
    id: "entrepreneurship",
    title: "Entrepreneurship",
    description: "Startup ecosystems, business ownership, and innovation among African youth.",
    icon: BookOpen,
    color: "green",
    stats: [
      { label: "Business Ownership", value: "12.6%" },
      { label: "Access to Finance", value: "23.4%" },
      { label: "Startup Formation", value: "3.2%" }
    ]
  }
];

const Themes = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-muted/30 py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold">Thematic Areas</h1>
              <p className="text-muted-foreground">
                Explore our five core thematic areas of youth development in Africa.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow py-8">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8">
            {themes.map((theme) => (
              <Card key={theme.id} className={`border-l-4 border-l-pan-${theme.color}-500`}>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-md bg-pan-${theme.color}-100 text-pan-${theme.color}-500`}>
                          <theme.icon className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold">{theme.title}</h2>
                      </div>
                      
                      <p className="text-muted-foreground mb-6">
                        {theme.description}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {theme.stats.map((stat, i) => (
                          <div key={i} className={`p-3 rounded-md bg-pan-${theme.color}-50`}>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-xl font-bold">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/explore?theme=${theme.id}`}>
                          <Button>Explore Data</Button>
                        </Link>
                        <Link to={`/explore?theme=${theme.id}`}>
                          <Button variant="outline">View Indicators</Button>
                        </Link>
                        <Link to={`/compare?theme=${theme.id}`}>
                          <Button variant="outline">Compare Countries</Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="hidden md:block md:col-span-1">
                      <div className={`h-full rounded-md bg-pan-${theme.color}-50 flex items-center justify-center p-6`}>
                        <div className="w-full aspect-square relative">
                          {theme.id === "population" && (
                            <div className="w-full h-full flex items-end justify-around">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-12 bg-pan-${theme.color}-${300 + (i * 50)} hover:bg-pan-${theme.color}-${400 + (i * 50)} transition-all rounded-t-md`}
                                  style={{ height: `${40 + Math.random() * 50}%` }}
                                ></div>
                              ))}
                            </div>
                          )}
                          
                          {theme.id === "education" && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-32 h-32 rounded-full border-8 border-pan-blue-300 flex items-center justify-center">
                                <span className="text-2xl font-bold text-pan-blue-500">73%</span>
                              </div>
                            </div>
                          )}
                          
                          {theme.id === "health" && (
                            <div className="w-full h-full flex items-center justify-center">
                              <Heart className="w-32 h-32 text-pan-purple-300" />
                            </div>
                          )}
                          
                          {theme.id === "employment" && (
                            <div className="w-full h-full flex items-end justify-around">
                              <div className="w-24 h-24 rounded-full border-8 border-pan-orange-300 flex items-center justify-center relative">
                                <span className="text-2xl font-bold text-pan-orange-500">42%</span>
                                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-pan-orange-500 flex items-center justify-center text-white font-bold">
                                  +
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {theme.id === "entrepreneurship" && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="w-12 h-12 rounded-md bg-pan-green-300"></div>
                                <div className="w-12 h-12 rounded-md bg-pan-green-400"></div>
                                <div className="w-12 h-12 rounded-md bg-pan-green-500"></div>
                                <div className="w-12 h-12 rounded-md bg-pan-green-600"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Themes;
