
import React from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Heart, Briefcase, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const statsData = [
  {
    title: 'Population',
    value: '226M',
    description: 'African youth aged 15-24',
    trend: '+2.3%',
    color: 'pan-green',
    icon: Users,
    link: '/themes/population'
  },
  {
    title: 'Education',
    value: '63%',
    description: 'Secondary enrollment rate',
    trend: '+5.7%',
    color: 'pan-blue',
    icon: GraduationCap,
    link: '/themes/education'
  },
  {
    title: 'Health',
    value: '72%',
    description: 'Access to healthcare',
    trend: '+3.1%',
    color: 'pan-purple',
    icon: Heart,
    link: '/themes/health'
  },
  {
    title: 'Employment',
    value: '42%',
    description: 'Youth labor participation',
    trend: '-1.2%',
    color: 'pan-orange',
    icon: Briefcase,
    link: '/themes/employment'
  },
  {
    title: 'Entrepreneurship',
    value: '18%',
    description: 'Youth-led businesses',
    trend: '+4.5%',
    color: 'pan-green',
    icon: BookOpen,
    link: '/themes/entrepreneurship'
  }
];

const QuickStats = () => {
  return (
    <section className="py-12">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Key Statistics
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl mx-auto">
              Explore essential data points on African youth across our five core thematic areas.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-8">
          {statsData.map((stat, index) => (
            <Link key={index} to={stat.link} className="block group">
              <Card className={`stat-card border-l-4 border-l-${stat.color}-500 group-hover:border-l-6 transition-all`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                      <h3 className="text-2xl font-bold">{stat.value}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-${stat.color}-100 text-${stat.color}-500`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-xs">
                    <span className={`inline-block px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {stat.trend} since 2020
                    </span>
                  </div>
                  
                  <div className="mt-4 mini-chart">
                    {/* Simplified chart visual - in real implementation, this would be a proper recharts component */}
                    <div className="h-full w-full flex items-end">
                      {[...Array(10)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 mx-0.5 bg-${stat.color}-${200 + (i * 50)} rounded-t`}
                          style={{ height: `${20 + Math.random() * 80}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickStats;
