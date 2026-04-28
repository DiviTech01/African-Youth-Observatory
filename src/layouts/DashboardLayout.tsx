import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LiveDataTicker from '@/components/LiveDataTicker';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Search,
  Globe,
  Layers,
  BarChart3,
  ArrowLeftRight,
  Lightbulb,
  MessageSquare,
  Shield,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

const adminLinks = [
  { to: '/admin', label: 'Admin Panel', icon: ShieldCheck },
  { to: '/admin/cms', label: 'Content Manager', icon: FileText },
  { to: '/admin/reports', label: 'Reports & Files', icon: FileText },
  { to: '/dashboard/data-upload', label: 'Upload Data', icon: Upload },
];

const dataLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/explore', label: 'Data Explorer', icon: Search },
  { to: '/dashboard/countries', label: 'Countries', icon: Globe },
  { to: '/dashboard/themes', label: 'Themes', icon: Layers },
  { to: '/dashboard/youth-index', label: 'Youth Index', icon: BarChart3 },
  { to: '/dashboard/compare', label: 'Compare', icon: ArrowLeftRight },
  { to: '/dashboard/insights', label: 'AI Insights', icon: Lightbulb },
  { to: '/dashboard/ask', label: 'Ask AI', icon: MessageSquare },
  { to: '/dashboard/policy-monitor', label: 'Policy Monitor', icon: Shield },
  { to: '/dashboard/experts', label: 'Experts', icon: Users },
  { to: '/dashboard/reports', label: 'Reports', icon: FileText },
];

const contributorLinks = [
  { to: '/dashboard/data-upload', label: 'Upload Data', icon: Upload },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  // Desktop sidebar shows icons-only by default; expands on hover.
  // Existing render code is keyed off `collapsed`, so we derive it.
  const collapsed = !hovered;

  const isAdmin = user?.role === 'ADMIN';
  const isContributor = user?.role === 'CONTRIBUTOR';

  const handleSignOut = () => {
    signOut();
    navigate('/auth/signin');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  /* ── NavLink used in both mobile sheet and desktop sidebar ── */
  const NavLink = ({
    to,
    label,
    icon: Icon,
    accent = false,
    isCollapsed = false,
  }: {
    to: string;
    label: string;
    icon: React.ElementType;
    accent?: boolean;
    isCollapsed?: boolean;
  }) => (
    <Link
      to={to}
      onClick={() => setSidebarOpen(false)}
      title={isCollapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
        isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
      } ${
        isActive(to)
          ? accent
            ? 'bg-red-500/15 text-red-400'
            : 'bg-primary/10 text-primary'
          : accent
          ? 'text-red-400/70 hover:bg-red-500/10 hover:text-red-400'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  /* ── Mobile sidebar content (always expanded) ── */
  const MobileSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${
              isAdmin ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'
            }`}
          >
            AYO
          </div>
          <div>
            <span className="font-display font-bold text-sm block leading-tight">
              African Youth Observatory
            </span>
            {isAdmin && (
              <span className="text-[10px] text-red-400 font-semibold">Admin Access</span>
            )}
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {isAdmin && (
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-400/60">
              Administration
            </p>
            <div className="space-y-0.5">
              {adminLinks.map((link) => (
                <NavLink key={link.to} {...link} accent />
              ))}
            </div>
          </div>
        )}

        {isContributor && (
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">
              Contributor
            </p>
            <div className="space-y-0.5">
              {contributorLinks.map((link) => (
                <NavLink key={link.to} {...link} />
              ))}
            </div>
          </div>
        )}

        <div>
          {(isAdmin || isContributor) && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Data &amp; Analytics
            </p>
          )}
          <div className="space-y-0.5">
            {dataLinks.map((link) => (
              <NavLink key={link.to} {...link} />
            ))}
          </div>
        </div>
      </nav>

      {/* User info + actions */}
      <div className="p-3 border-t border-border space-y-1">
        {user && (
          <div className="px-3 py-2 mb-1 flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isAdmin ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
              }`}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user.name || user.email}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
        )}
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  /* ── Desktop sidebar content (supports collapsed) ── */
  const DesktopSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link
          to="/"
          className="flex items-center gap-2"
          title={collapsed ? 'African Youth Observatory' : undefined}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm flex-shrink-0 ${
              isAdmin ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'
            }`}
          >
            AYO
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-display font-bold text-sm block leading-tight truncate">
                African Youth Observatory
              </span>
              {isAdmin && (
                <span className="text-[10px] text-red-400 font-semibold">Admin Access</span>
              )}
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {isAdmin && (
          <div>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-400/60">
                Administration
              </p>
            )}
            <div className="space-y-0.5">
              {adminLinks.map((link) => (
                <NavLink key={link.to} {...link} accent isCollapsed={collapsed} />
              ))}
            </div>
          </div>
        )}

        {isContributor && (
          <div>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">
                Contributor
              </p>
            )}
            <div className="space-y-0.5">
              {contributorLinks.map((link) => (
                <NavLink key={link.to} {...link} isCollapsed={collapsed} />
              ))}
            </div>
          </div>
        )}

        <div>
          {!collapsed && (isAdmin || isContributor) && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Data &amp; Analytics
            </p>
          )}
          <div className="space-y-0.5">
            {dataLinks.map((link) => (
              <NavLink key={link.to} {...link} isCollapsed={collapsed} />
            ))}
          </div>
        </div>
      </nav>

      {/* User info + actions */}
      <div className="p-3 border-t border-border space-y-1">
        {user && !collapsed && (
          <div className="px-3 py-2 mb-1 flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isAdmin ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
              }`}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user.name || user.email}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
        )}

        {collapsed && user && (
          <div className="flex justify-center py-2" title={user.name || user.email}>
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isAdmin ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
              }`}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <Link
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={`flex items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && 'Settings'}
        </Link>
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  );

  // Derive topbar title from current path
  const pageTitle = (() => {
    const p = location.pathname;
    if (p === '/admin/cms') return 'Content Manager';
    if (p === '/admin/reports') return 'Reports & Files';
    if (p === '/admin') return 'Admin Panel';
    if (p === '/dashboard') return 'Overview';
    if (p.includes('explore')) return 'Data Explorer';
    if (p.includes('countries')) return 'Countries';
    if (p.includes('themes')) return 'Themes';
    if (p.includes('youth-index')) return 'Youth Index';
    if (p.includes('compare')) return 'Compare';
    if (p.includes('insights')) return 'AI Insights';
    if (p.includes('ask')) return 'Ask AI';
    if (p.includes('policy-monitor')) return 'Policy Monitor';
    if (p.includes('experts')) return 'Experts';
    if (p.includes('reports')) return 'Reports';
    if (p.includes('data-upload')) return 'Upload Data';
    if (p.includes('settings')) return 'Settings';
    return 'Dashboard';
  })();

  const userInitial = user ? (user.name || user.email).charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Desktop Sidebar — fixed, hover-to-expand. Main content shifts right to match. */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="hidden lg:flex flex-col border-r border-border bg-sidebar-background fixed top-0 left-0 h-screen z-50 transition-[width] duration-200 ease-in-out overflow-hidden shadow-lg shadow-black/20"
        style={{ width: hovered ? 240 : 64 }}
      >
        <DesktopSidebarContent />
      </aside>

      {/* Main Content — left margin tracks the sidebar width so content shifts on hover. */}
      <div
        className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: isDesktop ? (hovered ? 240 : 64) : 0 }}
      >
        <LiveDataTicker />

        {/* Top Bar */}
        <header
          className={`sticky top-0 z-40 h-14 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 ${
            isAdmin && location.pathname === '/admin'
              ? 'bg-red-950/30'
              : 'bg-background/95'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <MobileSidebarContent />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              {location.pathname === '/admin' && (
                <ShieldCheck className="h-4 w-4 text-red-400" />
              )}
              <h1
                className={`text-sm font-semibold ${
                  location.pathname === '/admin' ? 'text-red-400' : 'text-foreground'
                }`}
              >
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right side: avatar links straight to the profile tab in /settings */}
          <div className="flex items-center gap-3">
            {user && (
              <Link
                to="/settings#profile"
                title="Open profile"
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-opacity hover:opacity-80 ${
                    isAdmin
                      ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                      : 'bg-primary/20 text-primary ring-1 ring-primary/30'
                  }`}
                >
                  {userInitial}
                </div>
              </Link>
            )}
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
