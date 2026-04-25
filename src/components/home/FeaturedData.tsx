import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart, TrendingUp, ArrowRight, Download } from 'lucide-react';
import { Content } from '@/components/cms';
import { useToast } from '@/hooks/use-toast';
import { useExportGuard } from '@/hooks/useExportGuard';
import { GuestInviteModal } from '@/components/GuestInviteModal';
// African divider removed

const featuredItems = [
  {
    slug: 'unemployment',
    icon: BarChart3,
    title: 'Youth Unemployment Trends',
    description: 'Analysis of youth unemployment rates across African regions from 2010-2023.',
    color: 'from-green-500/20 to-green-500/5',
    iconColor: 'text-green-400',
    borderColor: 'border-green-500/20 hover:border-green-500/40',
    link: '/explore?theme=employment',
  },
  {
    slug: 'education_gender',
    icon: PieChart,
    title: 'Education Access by Gender',
    description: 'Comparative analysis of education access and completion rates by gender.',
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/20 hover:border-blue-500/40',
    link: '/explore?theme=education',
  },
  {
    slug: 'entrepreneurship',
    icon: TrendingUp,
    title: 'Youth-led Entrepreneurship',
    description: 'Emerging trends in youth entrepreneurship and business formation across Africa.',
    color: 'from-orange-500/20 to-orange-500/5',
    iconColor: 'text-orange-400',
    borderColor: 'border-orange-500/20 hover:border-orange-500/40',
    link: '/explore?theme=entrepreneurship',
  },
];

const FeaturedData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { guard, inviteOpen, setInviteOpen, inviteAction } = useExportGuard();

  const handleDownload = (e: React.MouseEvent, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    guard(
      () => toast({
        title: 'Download coming soon',
        description: `"${title}" download will be available shortly.`,
      }),
      'download',
    );
  };

  const handleExplore = (e: React.MouseEvent, link: string) => {
    e.preventDefault();
    navigate(link);
  };

  return (
    <section className="relative py-16 md:py-24 bg-black overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4 text-center mb-10 md:mb-14">
          <Content
            as="h2"
            id="home.featured.title"
            fallback="Featured Insights"
            className="text-3xl sm:text-4xl font-semibold tracking-tighter md:text-5xl
            bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40
            bg-clip-text text-transparent"
          />
          <Content
            as="p"
            id="home.featured.subtitle"
            fallback="Explore our latest visualizations and reports on African youth development."
            className="max-w-[700px] text-sm sm:text-base text-[#A89070] md:text-lg"
          />
        </div>

        <GuestInviteModal open={inviteOpen} onOpenChange={setInviteOpen} action={inviteAction} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item) => (
            <div
              key={item.slug}
              role="button"
              tabIndex={0}
              onClick={(e) => handleExplore(e, item.link)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleExplore(e as any, item.link); }}
              className={`group relative rounded-2xl border ${item.borderColor} bg-white/[0.03] backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
            >
              {/* Gradient top accent */}
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${item.color}`} />

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors`}>
                <item.icon className={`w-6 h-6 ${item.iconColor}`} />
              </div>

              {/* Content */}
              <Content
                as="h3"
                id={`home.featured.${item.slug}.title`}
                fallback={item.title}
                className="text-lg font-semibold text-white mb-2 tracking-tight"
              />
              <Content
                as="p"
                id={`home.featured.${item.slug}.description`}
                fallback={item.description}
                className="text-sm text-gray-400 mb-6 leading-relaxed"
              />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 group-hover:text-white transition-colors flex items-center gap-1">
                  <Content as="span" id="home.featured.explore_cta" fallback="Explore" />
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-white h-8 px-2"
                  onClick={(e) => handleDownload(e, item.title)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 md:mt-14 flex justify-center">
          <Link to="/reports">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 tracking-tight"
            >
              <Content as="span" id="home.featured.view_all" fallback="View All Reports" />
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedData;
