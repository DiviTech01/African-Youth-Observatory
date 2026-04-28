import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Search, UserPlus, MapPin, Briefcase, Globe, Check, X, Sparkles, Languages, GraduationCap, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import CountryFlag from '@/components/CountryFlag';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Expert {
  id: number;
  name: string;
  initials: string;
  title: string;
  organization: string;
  country: string;
  specializations: string[];
  languages: string[];
  color: string;
}

const experts: Expert[] = [
  {
    id: 1,
    name: 'Dr. Amina Osei',
    initials: 'AO',
    title: 'Senior Research Fellow',
    organization: 'African Development Bank',
    country: 'Ghana',
    specializations: ['Youth Employment', 'Economic Policy', 'Gender Equality'],
    languages: ['English', 'French', 'Twi'],
    color: 'bg-pan-green-500',
  },
  {
    id: 2,
    name: 'Prof. Tendai Moyo',
    initials: 'TM',
    title: 'Director of Youth Studies',
    organization: 'University of Cape Town',
    country: 'South Africa',
    specializations: ['Education Policy', 'Digital Literacy'],
    languages: ['English', 'Zulu', 'Afrikaans'],
    color: 'bg-pan-blue-500',
  },
  {
    id: 3,
    name: 'Dr. Fatima Diallo',
    initials: 'FD',
    title: 'Policy Advisor',
    organization: 'African Union Commission',
    country: 'Senegal',
    specializations: ['Youth Policy', 'Governance', 'Francophone Africa'],
    languages: ['French', 'English', 'Wolof'],
    color: 'bg-pan-gold-500',
  },
  {
    id: 4,
    name: 'Mr. Kwame Mensah',
    initials: 'KM',
    title: 'Programme Manager',
    organization: 'UNDP Africa Regional Bureau',
    country: 'Kenya',
    specializations: ['Youth Entrepreneurship', 'Innovation'],
    languages: ['English', 'Swahili'],
    color: 'bg-pan-red-500',
  },
  {
    id: 5,
    name: 'Dr. Ngozi Eze',
    initials: 'NE',
    title: 'Health Systems Researcher',
    organization: 'WHO AFRO',
    country: 'Nigeria',
    specializations: ['Youth Health', 'Reproductive Health', 'Data Systems'],
    languages: ['English', 'Igbo'],
    color: 'bg-purple-500',
  },
  {
    id: 6,
    name: 'Ms. Halima Abdi',
    initials: 'HA',
    title: 'Youth Development Specialist',
    organization: 'UNICEF East Africa',
    country: 'Ethiopia',
    specializations: ['Education', 'Child Protection', 'Humanitarian'],
    languages: ['English', 'Amharic', 'Somali'],
    color: 'bg-teal-500',
  },
  {
    id: 7,
    name: 'Dr. Jean-Pierre Habimana',
    initials: 'JH',
    title: 'Lead Economist',
    organization: 'Rwanda Development Board',
    country: 'Rwanda',
    specializations: ['Economic Modelling', 'Digital Economy'],
    languages: ['French', 'English', 'Kinyarwanda'],
    color: 'bg-indigo-500',
  },
  {
    id: 8,
    name: 'Prof. Aisha Mohamed',
    initials: 'AM',
    title: 'Chair, Dept. of Sociology',
    organization: 'University of Dar es Salaam',
    country: 'Tanzania',
    specializations: ['Youth Civic Participation', 'Social Research'],
    languages: ['English', 'Swahili', 'Arabic'],
    color: 'bg-rose-500',
  },
  {
    id: 9,
    name: 'Mr. Chidi Okafor',
    initials: 'CO',
    title: 'Data Science Lead',
    organization: 'Mo Ibrahim Foundation',
    country: 'Nigeria',
    specializations: ['Data Analytics', 'Governance Indicators', 'AI for Development'],
    languages: ['English', 'Yoruba'],
    color: 'bg-cyan-500',
  },
];

const mockCountries = [...new Set(experts.map((e) => e.country))].sort();
const mockSpecializations = [...new Set(experts.flatMap((e) => e.specializations))].sort();
const mockLanguages = [...new Set(experts.flatMap((e) => e.languages))].sort();

const avatarColors = ['bg-pan-green-500', 'bg-pan-blue-500', 'bg-pan-gold-500', 'bg-pan-red-500', 'bg-purple-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-cyan-500'];

const registrationSpecializations = [
  'Youth Employment',
  'Development Economics',
  'Youth Entrepreneurship',
  'Youth Policy',
  'Youth Health',
  'Education Policy',
  'Digital Literacy',
  'Data Science',
  'Gender Equality',
  'Innovation',
  'Climate Change',
  'Civic Participation',
  'Peace Building',
  'STEM Education',
  'Financial Inclusion',
  'Migration',
  'Social Protection',
  'Youth Mental Health',
];

const apiBase = import.meta.env.VITE_API_URL || '/api';

const Experts = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  // View Profile dialog state
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTitle, setRegTitle] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regCountry, setRegCountry] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [regLanguages, setRegLanguages] = useState('');
  const [regBio, setRegBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch experts from API
  const { data: apiExperts, isLoading, isError } = useQuery({
    queryKey: ['experts', { search: search || undefined }],
    queryFn: () => api.experts.list({ search: search || undefined }),
  });

  // Merge API data with mock fallback
  const allExperts = useMemo(() => {
    const apiData = (apiExperts as any)?.data || apiExperts;
    if (Array.isArray(apiData) && apiData.length > 0) {
      return apiData.map((e: any, i: number) => ({
        id: e.id || i,
        name: e.name,
        initials: e.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        title: e.title,
        organization: e.organization || '',
        country: e.country?.name || e.country || '',
        specializations: e.specializations || [],
        languages: e.languages || [],
        color: avatarColors[i % avatarColors.length],
      }));
    }
    return experts;
  }, [apiExperts]);

  const allCountries = useMemo(() => [...new Set(allExperts.map((e: any) => e.country))].sort() as string[], [allExperts]);
  const allSpecializations = useMemo(() => [...new Set(allExperts.flatMap((e: any) => e.specializations))].sort() as string[], [allExperts]);
  const allLanguages = useMemo(() => [...new Set(allExperts.flatMap((e: any) => e.languages))].sort() as string[], [allExperts]);

  const filtered = useMemo(() => {
    return allExperts.filter((e: any) => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.organization || '').toLowerCase().includes(search.toLowerCase()) ||
        e.specializations.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
      const matchCountry = countryFilter === 'all' || e.country === countryFilter;
      const matchSpec = specFilter === 'all' || e.specializations.includes(specFilter);
      const matchLang = langFilter === 'all' || e.languages.includes(langFilter);
      return matchSearch && matchCountry && matchSpec && matchLang;
    });
  }, [allExperts, search, countryFilter, specFilter, langFilter]);

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
    // Clear specialization error when user selects
    if (formErrors.specializations) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.specializations;
        return next;
      });
    }
  };

  const resetForm = () => {
    setRegName('');
    setRegEmail('');
    setRegTitle('');
    setRegOrg('');
    setRegCountry('');
    setSelectedSpecs([]);
    setRegLanguages('');
    setRegBio('');
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!regName.trim()) errors.name = 'Full name is required';
    if (!regEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) errors.email = 'Invalid email address';
    if (!regTitle.trim()) errors.title = 'Title / Role is required';
    if (!regOrg.trim()) errors.organization = 'Organization is required';
    if (!regCountry) errors.country = 'Country is required';
    if (selectedSpecs.length === 0) errors.specializations = 'Select at least one specialization';
    if (!regLanguages.trim()) errors.languages = 'Languages are required';
    if (!regBio.trim()) errors.bio = 'Bio is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: regName.trim(),
        email: regEmail.trim(),
        title: regTitle.trim(),
        organization: regOrg.trim(),
        country: regCountry,
        specializations: selectedSpecs,
        languages: regLanguages.split(',').map((l) => l.trim()).filter(Boolean),
        bio: regBio.trim(),
      };

      const res = await fetch(`${apiBase}/experts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Registration failed (${res.status})`);
      }

      toast.success(
        "Your registration has been submitted! You'll receive a confirmation email shortly. Your profile will be visible once approved by an admin."
      );
      resetForm();
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProfile = (expert: Expert) => {
    setSelectedExpert(expert);
    setProfileDialogOpen(true);
  };

  return (
    <>
      <header className="relative pt-6 pb-3 md:pt-8 md:pb-4 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-8 w-8 text-[#D4A017]" />
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">{t('experts.title')}</h1>
              </div>
              <p className="text-[#A89070]">
                {t('experts.subtitle')}
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { resetForm(); } }}>
              <DialogTrigger asChild>
                <Button className="gap-2 self-start">
                  <UserPlus className="h-4 w-4" />
                  Register as Expert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-black/95 border-gray-800">
                <DialogHeader>
                  <DialogTitle>Register as an Expert</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-4 mt-2"
                  onSubmit={handleRegistrationSubmit}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name *</Label>
                      <Input
                        id="reg-name"
                        placeholder="Your full name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                      {formErrors.name && <p className="text-xs text-red-400">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email *</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="Email address"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                      {formErrors.email && <p className="text-xs text-red-400">{formErrors.email}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-title">Title / Role *</Label>
                      <Input
                        id="reg-title"
                        placeholder="e.g., Research Fellow"
                        value={regTitle}
                        onChange={(e) => setRegTitle(e.target.value)}
                      />
                      {formErrors.title && <p className="text-xs text-red-400">{formErrors.title}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-org">Organization *</Label>
                      <Input
                        id="reg-org"
                        placeholder="Your organization"
                        value={regOrg}
                        onChange={(e) => setRegOrg(e.target.value)}
                      />
                      {formErrors.organization && <p className="text-xs text-red-400">{formErrors.organization}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Select value={regCountry} onValueChange={setRegCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCountries.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.country && <p className="text-xs text-red-400">{formErrors.country}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Specializations * <span className="text-xs text-gray-400">(select one or more)</span></Label>
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-gray-800 bg-white/[0.03] max-h-[180px] overflow-y-auto">
                      {registrationSpecializations.map((spec) => {
                        const isSelected = selectedSpecs.includes(spec);
                        return (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => toggleSpec(spec)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border cursor-pointer ${
                              isSelected
                                ? 'bg-primary/20 text-primary border-primary/40'
                                : 'bg-white/[0.03] text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {spec}
                          </button>
                        );
                      })}
                    </div>
                    {selectedSpecs.length > 0 && (
                      <p className="text-xs text-gray-400">{selectedSpecs.length} selected</p>
                    )}
                    {formErrors.specializations && <p className="text-xs text-red-400">{formErrors.specializations}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-languages">Languages * <span className="text-xs text-gray-400">(comma-separated)</span></Label>
                    <Input
                      id="reg-languages"
                      placeholder="e.g., English, French, Swahili"
                      value={regLanguages}
                      onChange={(e) => setRegLanguages(e.target.value)}
                    />
                    {formErrors.languages && <p className="text-xs text-red-400">{formErrors.languages}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-bio">Bio *</Label>
                    <Textarea
                      id="reg-bio"
                      placeholder="Brief professional bio..."
                      rows={3}
                      value={regBio}
                      onChange={(e) => setRegBio(e.target.value)}
                    />
                    {formErrors.bio && <p className="text-xs text-red-400">{formErrors.bio}</p>}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="pt-2 md:pt-3 pb-6 md:pb-8">
        <div className="container px-4 md:px-6">
          {/* Hero stats — directory at a glance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { icon: Users, label: 'Experts', value: allExperts.length, accent: '#22C55E' },
              { icon: MapPin, label: 'Countries', value: allCountries.length, accent: '#3B82F6' },
              { icon: GraduationCap, label: 'Specializations', value: allSpecializations.length, accent: '#D4A017' },
              { icon: Languages, label: 'Languages', value: allLanguages.length, accent: '#A855F7' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80 flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: s.accent + '20', color: s.accent }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: s.accent }}>
                      {isLoading ? '—' : s.value}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mt-1">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact filter bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, organization, or expertise…"
                className="pl-9 h-9 text-xs bg-white/[0.03] border-gray-800"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs bg-white/[0.03] border-gray-800">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All countries</SelectItem>
                {allCountries.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={specFilter} onValueChange={setSpecFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs bg-white/[0.03] border-gray-800">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All specializations</SelectItem>
                {allSpecializations.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={langFilter} onValueChange={setLangFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs bg-white/[0.03] border-gray-800">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All languages</SelectItem>
                {allLanguages.map((l) => (
                  <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {(countryFilter !== 'all' || specFilter !== 'all' || langFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mr-1">Active:</span>
              {countryFilter !== 'all' && (
                <button
                  onClick={() => setCountryFilter('all')}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] bg-white/[0.05] border border-gray-800 hover:border-gray-700 text-gray-300"
                >
                  <MapPin className="h-3 w-3" /> {countryFilter} <X className="h-3 w-3" />
                </button>
              )}
              {specFilter !== 'all' && (
                <button
                  onClick={() => setSpecFilter('all')}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] bg-white/[0.05] border border-gray-800 hover:border-gray-700 text-gray-300"
                >
                  <Sparkles className="h-3 w-3" /> {specFilter} <X className="h-3 w-3" />
                </button>
              )}
              {langFilter !== 'all' && (
                <button
                  onClick={() => setLangFilter('all')}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] bg-white/[0.05] border border-gray-800 hover:border-gray-700 text-gray-300"
                >
                  <Languages className="h-3 w-3" /> {langFilter} <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Results count */}
          <p className="text-xs text-gray-500 mb-4">
            {isLoading ? 'Loading experts…' : (
              <>
                <span className="text-gray-300 font-semibold tabular-nums">{filtered.length}</span> of{' '}
                <span className="text-gray-300 font-semibold tabular-nums">{allExperts.length}</span> experts
              </>
            )}
            {isError && <Badge variant="secondary" className="ml-2 text-[10px]">Offline</Badge>}
          </p>

          {/* Expert grid */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl bg-white/[0.03]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-gray-800 bg-white/[0.02]">
              <Users className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-300">No experts found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((expert) => (
                <button
                  key={expert.id}
                  onClick={() => handleViewProfile(expert)}
                  className="group text-left relative rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-gray-800/80 overflow-hidden hover:border-gray-700 hover:-translate-y-0.5 transition-all"
                >
                  {/* Top accent stripe — colored per expert */}
                  <div
                    className="h-1 w-full"
                    style={{ background: `linear-gradient(90deg, ${expert.color.replace('bg-', '#').replace('pan-green-500', '22C55E').replace('pan-blue-500', '3B82F6').replace('pan-gold-500', 'F59E0B').replace('pan-red-500', 'EF4444').replace('purple-500', 'A855F7').replace('teal-500', '14B8A6')}aa, transparent)` }}
                  />
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-12 w-12 text-base ring-2 ring-white/[0.06] flex-shrink-0">
                        <AvatarFallback className={`${expert.color} text-white font-bold`}>
                          {expert.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-white truncate group-hover:text-[#D4A017] transition-colors">{expert.name}</h3>
                        <p className="text-xs text-gray-400 truncate">{expert.title}</p>
                        <p className="text-[11px] text-gray-500 truncate inline-flex items-center gap-1 mt-0.5">
                          <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
                          {expert.organization}
                        </p>
                      </div>
                    </div>

                    {/* Country pill */}
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-gray-300">
                      <CountryFlag country={expert.country} size="xs" />
                      {expert.country}
                    </div>

                    {/* Specializations */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {expert.specializations.slice(0, 3).map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#D4A017]/10 text-[#D4A017] border border-[#D4A017]/20"
                        >
                          {spec}
                        </span>
                      ))}
                      {expert.specializations.length > 3 && (
                        <span className="text-[10px] text-gray-500 self-center">+{expert.specializations.length - 3}</span>
                      )}
                    </div>

                    {/* Languages */}
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
                      <Languages className="h-3 w-3 text-gray-500 flex-shrink-0" />
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        {expert.languages.map((l, i) => (
                          <span key={l} className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">
                            {l.slice(0, 3)}{i < expert.languages.length - 1 && <span className="text-gray-700 ml-1.5">·</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 inline-flex items-center gap-1 text-[11px] text-gray-500 group-hover:text-[#D4A017] transition-colors">
                      View profile
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-black/95 border-gray-800">
          {selectedExpert && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">{selectedExpert.name} Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 text-xl">
                    <AvatarFallback className={`${selectedExpert.color} text-white font-bold`}>
                      {selectedExpert.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{selectedExpert.name}</h2>
                    <p className="text-sm text-gray-400">{selectedExpert.title}</p>
                  </div>
                </div>

                {/* Organization */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Briefcase className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-gray-300">Organization</span>
                  </div>
                  <p className="text-sm pl-6">{selectedExpert.organization}</p>
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-gray-300">Country</span>
                  </div>
                  <div className="pl-6">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                      <CountryFlag country={selectedExpert.country} size="xs" />
                      {selectedExpert.country}
                    </Badge>
                  </div>
                </div>

                {/* Specializations */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">Specializations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedExpert.specializations.map((spec) => (
                      <Badge
                        key={spec}
                        className="bg-primary/10 text-primary border-primary/20 text-xs"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-gray-300">Languages</span>
                  </div>
                  <p className="text-sm pl-6">{selectedExpert.languages.join(', ')}</p>
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-300">Bio</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {selectedExpert.name} is a {selectedExpert.title.toLowerCase()} at {selectedExpert.organization}, based in {selectedExpert.country}. Their areas of expertise include {selectedExpert.specializations.join(', ').replace(/, ([^,]*)$/, ' and $1')}.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Experts;
