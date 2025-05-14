
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartBar, ChartPie, Download } from 'lucide-react';

const FeaturedData = () => {
  return (
    <section className="py-12 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Featured Insights
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl mx-auto">
              Explore our latest visualizations and reports on African youth development.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-pan-green-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <ChartBar className="w-12 h-12 text-pan-green-500" />
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">Youth Unemployment Trends</h3>
              <p className="text-muted-foreground mb-4">
                Analysis of youth unemployment rates across African regions from 2010-2023.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button size="sm">
                  View Data
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <div className="aspect-video bg-pan-blue-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <ChartPie className="w-12 h-12 text-pan-blue-500" />
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">Education Access by Gender</h3>
              <p className="text-muted-foreground mb-4">
                Comparative analysis of education access and completion rates by gender.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button size="sm">
                  View Data
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <div className="aspect-video bg-pan-orange-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <ChartBar className="w-12 h-12 text-pan-orange-500" />
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">Youth-led Entrepreneurship</h3>
              <p className="text-muted-foreground mb-4">
                Emerging trends in youth entrepreneurship and business formation.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button size="sm">
                  View Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-10 flex justify-center">
          <Link to="/reports">
            <Button variant="outline" size="lg">
              View All Reports
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedData;
