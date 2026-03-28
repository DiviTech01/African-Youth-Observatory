import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Search, UserPlus, MapPin, Briefcase, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import CountryFlag from '@/components/CountryFlag';
import { useLanguage } from '@/contexts/LanguageContext';

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

const allCountries = [...new Set(experts.map((e) => e.country))].sort();
const allSpecializations = [...new Set(experts.flatMap((e) => e.specializations))].sort();
const allLanguages = [...new Set(experts.flatMap((e) => e.languages))].sort();

const Experts = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return experts.filter((e) => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.organization.toLowerCase().includes(search.toLowerCase()) ||
        e.specializations.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      const matchCountry = countryFilter === 'all' || e.country === countryFilter;
      const matchSpec = specFilter === 'all' || e.specializations.includes(specFilter);
      const matchLang = langFilter === 'all' || e.languages.includes(langFilter);
      return matchSearch && matchCountry && matchSpec && matchLang;
    });
  }, [search, countryFilter, specFilter, langFilter]);

  return (
    <>
      <header className="gradient-hero py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="section-title">{t('experts.title')}</h1>
              </div>
              <p className="section-description">
                {t('experts.subtitle')}
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 self-start">
                  <UserPlus className="h-4 w-4" />
                  Register as Expert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register as an Expert</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-4 mt-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setDialogOpen(false);
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input id="reg-name" placeholder="Your full name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" type="email" placeholder="Email address" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-title">Title / Role</Label>
                      <Input id="reg-title" placeholder="e.g., Research Fellow" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-org">Organization</Label>
                      <Input id="reg-org" placeholder="Your organization" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select>
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
                    </div>
                    <div className="space-y-2">
                      <Label>Specialization</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          {allSpecializations.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-bio">Bio</Label>
                    <Textarea id="reg-bio" placeholder="Brief professional bio..." rows={3} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Registration</Button>
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
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative md:col-span-4 lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search experts..."
                    className="pl-9"
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
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filtered.length} of {experts.length} experts
          </p>

          {/* Expert Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((expert) => (
              <Card key={expert.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-14 w-14 text-lg">
                      <AvatarFallback className={`${expert.color} text-white font-bold`}>
                        {expert.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-base truncate">{expert.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{expert.title}</p>
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        {expert.organization}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      {expert.languages.join(', ')}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-medium">No experts found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Experts;
