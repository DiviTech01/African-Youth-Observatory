
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
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

function useCountUp(target: number, duration = 2000, suffix = '') {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, display: `${count}${suffix}` };
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: 'easeOut' },
  }),
};

const AnimatedStat = ({ target, suffix, label, icon: Icon, delay }: { target: number; suffix: string; label: string; icon: React.ElementType; delay: number }) => {
  const { ref, display } = useCountUp(target, 2000, suffix);
  return (
    <motion.div
      className="text-center space-y-2"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={delay}
    >
      <Icon className="h-8 w-8 mx-auto text-primary" />
      <p ref={ref} className="text-3xl md:text-4xl font-display font-bold text-foreground">{display}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
};

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
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <Sparkles className="h-4 w-4" />
              Africa's Premier Youth Data Intelligence Platform
            </motion.div>

            {/* Main Title */}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.15}
            >
              Empowering Africa's
              <span className="block gradient-text">Youth Through Data</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3}
            >
              Access comprehensive youth statistics across all 54 African nations.
              Power your research, policy decisions, and investments with trusted, real-time data.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.45}
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50 bg-muted/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedStat target={54} suffix="" label="African Countries" icon={MapPin} delay={0} />
            <AnimatedStat target={500} suffix="+" label="Data Indicators" icon={BarChart3} delay={0.1} />
            <AnimatedStat target={226} suffix="M" label="Youth Covered" icon={Users} delay={0.2} />
            <AnimatedStat target={10} suffix="+" label="Years of Data" icon={TrendingUp} delay={0.3} />
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
