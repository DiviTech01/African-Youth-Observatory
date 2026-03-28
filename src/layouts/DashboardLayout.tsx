import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Theme toggle removed - dark mode only
import LiveDataTicker from '@/components/LiveDataTicker';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BarChart3,
  Globe,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Users,
  BookOpen,
  Sparkles,
  Shield,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const sidebarLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/explore', label: 'Data Explorer', icon: BarChart3 },
  { to: '/dashboard/countries', label: 'Countries', icon: Globe },
  { to: '/dashboard/youth-index', label: 'Youth Index', icon: TrendingUp },
  { to: '/dashboard/compare', label: 'Compare', icon: FileText },
  { to: '/dashboard/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/dashboard/ask', label: 'Ask AI', icon: MessageSquare },
  { to: '/dashboard/policy-monitor', label: 'Policy Monitor', icon: Shield },
  { to: '/dashboard/experts', label: 'Experts', icon: Users },
  { to: '/dashboard/reports', label: 'Reports', icon: BookOpen },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            AYD
          </div>
          <span className="font-display font-bold text-sm">African Youth Database</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(link.to)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <link.icon className="h-4 w-4 flex-shrink-0" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-sidebar-background">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
        {/* Live Data Ticker */}
        <LiveDataTicker />

        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Mobile sidebar trigger */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8">
              Sign Out
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
