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
import { Users, Search, UserPlus, MapPin, Briefcase, Globe, Check } from 'lucide-react';
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
      <header className="relative py-8 md:py-12 overflow-hidden">
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

      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          {/* Search & Filters */}
          <Card className="mb-8 bg-white/[0.03] border-gray-800 rounded-2xl">
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative md:col-span-4 lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search experts..."
                    className="pl-9 border-gray-800 bg-white/[0.03]"
                  />
                </div>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {allCountries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={specFilter} onValueChange={setSpecFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {allSpecializations.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={langFilter} onValueChange={setLangFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {allLanguages.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results count */}
          <p className="text-sm text-gray-400 mb-4">
            {isLoading ? 'Loading experts...' : `Showing ${filtered.length} of ${allExperts.length} experts`}
            {isError && <Badge variant="secondary" className="ml-2 text-xs">Offline</Badge>}
          </p>

          {/* Expert Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((expert) => (
              <Card key={expert.id} className="hover:shadow-lg transition-shadow bg-white/[0.03] border-gray-800 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-14 w-14 text-lg">
                      <AvatarFallback className={`${expert.color} text-white font-bold`}>
                        {expert.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-base truncate">{expert.name}</h3>
                      <p className="text-sm text-gray-400 truncate">{expert.title}</p>
                      <p className="text-sm text-gray-400 truncate flex items-center gap-1">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        {expert.organization}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <CountryFlag country={expert.country} size="xs" />
                        {expert.country}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {expert.specializations.map((spec) => (
                        <Badge
                          key={spec}
                          className="bg-primary/10 text-primary border-primary/20 text-xs hover:bg-primary/20"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      {expert.languages.join(', ')}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    size="sm"
                    onClick={() => handleViewProfile(expert)}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-lg font-medium">No experts found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
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
