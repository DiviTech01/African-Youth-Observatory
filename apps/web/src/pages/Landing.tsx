
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  TrendingUp, 
  Globe, 
  Database, 
  Users, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  MapPin,
  BookOpen
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="container px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              AYD
            </div>
            <span className="font-display font-bold text-lg hidden sm:block">African Youth Database</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth/signin">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Africa's Premier Youth Data Intelligence Platform
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Empowering Africa's
              <span className="block gradient-text">Youth Through Data</span>
            </h1>

            {/* Description */}
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Access comprehensive youth statistics across all 54 African nations. 
              Power your research, policy decisions, and investments with trusted, real-time data.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto text-base gap-2 px-8">
                  <Database className="h-5 w-5" />
                  Start Exploring Data
                </Button>
              </Link>
              <Link to="/auth/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base gap-2 px-8">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50 bg-muted/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '54', label: 'African Countries', icon: MapPin },
              { value: '500+', label: 'Data Indicators', icon: BarChart3 },
              { value: '226M', label: 'Youth Covered', icon: Users },
              { value: '10+', label: 'Years of Data', icon: TrendingUp },
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className="text-center space-y-2 animate-fade-in"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <stat.icon className="h-8 w-8 mx-auto text-primary" />
                <p className="text-3xl md:text-4xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 animate-fade-in">
              Comprehensive Data Solutions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Everything you need to understand Africa's youth demographics and drive impactful decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: 'Interactive Maps',
                description: 'Visualize data across Africa with our dynamic, interactive mapping tools.',
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Deep dive into trends with powerful charts and comparative analysis.',
              },
              {
                icon: Database,
                title: 'Data Export',
                description: 'Download datasets in multiple formats for your research needs.',
              },
              {
                icon: Users,
                title: 'Youth Index (AYI)',
                description: 'Track country rankings across education, health, and economic dimensions.',
              },
              {
                icon: TrendingUp,
                title: 'Trend Analysis',
                description: 'Monitor changes over time with historical data spanning over a decade.',
              },
              {
                icon: BookOpen,
                title: 'Reports & Insights',
                description: 'Access curated reports and policy briefs from leading researchers.',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-border bg-card hover:bg-card/80 hover:border-primary/50 transition-all duration-300 hover-lift animate-fade-in"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-primary/5">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Ready to Unlock Africa's Youth Data?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join researchers, policymakers, and organizations using AYD to drive meaningful change across the continent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto text-base gap-2 px-8">
                  Create Free Account
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8">
                  Learn More About AYD
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                AYD
              </div>
              <span className="text-sm text-muted-foreground">
                © 2025 African Youth Database. Powered by PACSDA & ZeroUp Next.
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
