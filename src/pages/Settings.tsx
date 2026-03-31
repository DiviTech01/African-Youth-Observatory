import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CountryFlag from '@/components/CountryFlag';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useToast } from '@/hooks/use-toast';
import { X, Trash2, RotateCcw, Settings as SettingsIcon, Globe } from 'lucide-react';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';

const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo", "Côte d'Ivoire", "DRC", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia",
  "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius",
  "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
  "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone",
  "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo",
  "Tunisia", "Uganda", "Zambia", "Zimbabwe",
];

const REGIONS = [
  "North Africa",
  "West Africa",
  "Central Africa",
  "East Africa",
  "Southern Africa",
];

const Settings = () => {
  const { language, setLanguage } = useLanguage();
  const {
    preferences,
    setMyCountry,
    addFavoriteCountry,
    removeFavoriteCountry,
    setPreferredRegion,
    resetPreferences,
  } = useUserPreferences();
  const { toast } = useToast();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleSetMyCountry = (country: string) => {
    setMyCountry(country);
    toast({ title: 'Home country updated', description: `Set to ${country}.` });
  };

  const handleClearMyCountry = () => {
    setMyCountry(null);
    toast({ title: 'Home country cleared' });
  };

  const handleAddFavorite = (country: string) => {
    addFavoriteCountry(country);
    toast({ title: 'Favorite added', description: `${country} added to favorites.` });
  };

  const handleRemoveFavorite = (country: string) => {
    removeFavoriteCountry(country);
    toast({ title: 'Favorite removed', description: `${country} removed from favorites.` });
  };

  const handleSetRegion = (region: string) => {
    setPreferredRegion(region);
    toast({ title: 'Preferred region updated', description: `Set to ${region}.` });
  };

  const handleClearHistory = () => {
    // Clear recently viewed by resetting just that field via the context
    // The context doesn't expose a direct clear for recentlyViewed,
    // so we track an empty view to effectively signal clearing.
    // Actually, we need to reset only recentlyViewed. We'll use resetPreferences
    // approach but preserve other fields. For now, let's work within the API.
    // The simplest: we don't have a dedicated method, so we note this limitation.
    // We can call trackCountryView to push items but not clear. Let's just inform user.
    // Actually, looking at the context, resetPreferences clears everything.
    // We'll handle this by directly manipulating localStorage as a workaround,
    // or just note it. For a clean approach, let's store preferences and re-set.
    const stored = localStorage.getItem('ayd_user_preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.recentlyViewed = [];
        localStorage.setItem('ayd_user_preferences', JSON.stringify(parsed));
        // Force a re-render by triggering a page-level state change
        window.location.reload();
      } catch {
        // fallback
      }
    }
    toast({ title: 'History cleared', description: 'Recently viewed countries have been cleared.' });
  };

  const handleResetAll = () => {
    resetPreferences();
    setResetDialogOpen(false);
    toast({ title: 'All preferences reset', description: 'Your settings have been restored to defaults.' });
  };

  const availableFavorites = AFRICAN_COUNTRIES.filter(
    (c) => !preferences.favoriteCountries.includes(c)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-7 w-7 text-[#D4A017]" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent">Settings</h1>
          <p className="text-sm sm:text-base text-[#A89070]">
            Personalize your experience on the African Youth Database.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="flex flex-col gap-6">

            {/* Language */}
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Language
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose your preferred language for the interface.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={language}
                  onValueChange={(value) => setLanguage(value as typeof language)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {LANGUAGES.map((lang) => (
                    <div key={lang.code} className="flex items-center space-x-2">
                      <RadioGroupItem value={lang.code} id={`lang-${lang.code}`} />
                      <Label htmlFor={`lang-${lang.code}`} className="cursor-pointer">
                        {lang.nativeName} <span className="text-gray-400">({lang.name})</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* My Country */}
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle>My Country</CardTitle>
                <CardDescription className="text-gray-400">
                  Set your home country. This will personalize your experience across the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Select
                    value={preferences.myCountry ?? ''}
                    onValueChange={handleSetMyCountry}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          <span className="flex items-center gap-2">
                            <CountryFlag country={country} size="xs" />
                            {country}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {preferences.myCountry && (
                    <Button variant="outline" size="sm" onClick={handleClearMyCountry}>
                      Clear
                    </Button>
                  )}
                </div>
                {preferences.myCountry && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CountryFlag country={preferences.myCountry} size="md" />
                    <span className="font-medium text-foreground">{preferences.myCountry}</span>
                    is your home country
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorite Countries */}
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle>Favorite Countries</CardTitle>
                <CardDescription className="text-gray-400">
                  Quick access to countries you track frequently.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {preferences.favoriteCountries.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferences.favoriteCountries.map((country) => (
                      <Badge
                        key={country}
                        variant="secondary"
                        className="flex items-center gap-1.5 px-2.5 py-1 text-sm"
                      >
                        <CountryFlag country={country} size="xs" />
                        {country}
                        <button
                          onClick={() => handleRemoveFavorite(country)}
                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          aria-label={`Remove ${country}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {preferences.favoriteCountries.length >= 10 ? (
                  <p className="text-sm text-gray-400">
                    Maximum of 10 favorites reached. Remove one to add another.
                  </p>
                ) : (
                  <Select onValueChange={handleAddFavorite} value="">
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Add a country to favorites" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFavorites.map((country) => (
                        <SelectItem key={country} value={country}>
                          <span className="flex items-center gap-2">
                            <CountryFlag country={country} size="xs" />
                            {country}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {preferences.favoriteCountries.length === 0 && (
                  <p className="text-sm text-gray-400">
                    No favorites yet. Add up to 10 countries for quick access.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Preferred Region */}
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle>Preferred Region</CardTitle>
                <CardDescription className="text-gray-400">
                  Filter data to your region by default.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={preferences.preferredRegion ?? ''}
                  onValueChange={handleSetRegion}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {REGIONS.map((region) => (
                    <div key={region} className="flex items-center space-x-2">
                      <RadioGroupItem value={region} id={`region-${region}`} />
                      <Label htmlFor={`region-${region}`} className="cursor-pointer">
                        {region}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {preferences.preferredRegion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setPreferredRegion(null);
                      toast({ title: 'Preferred region cleared' });
                    }}
                  >
                    Clear region preference
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recently Viewed */}
            <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle>Recently Viewed</CardTitle>
                <CardDescription className="text-gray-400">
                  Countries you have viewed recently.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {preferences.recentlyViewed.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {preferences.recentlyViewed.map((country) => (
                        <Badge
                          key={country}
                          variant="outline"
                          className="flex items-center gap-1.5 px-2.5 py-1 text-sm"
                        >
                          <CountryFlag country={country} size="xs" />
                          {country}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleClearHistory}>
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Clear History
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    No recently viewed countries.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Reset All Preferences */}
            <Card className="border-destructive/50 bg-white/[0.03] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-destructive">Reset All Preferences</CardTitle>
                <CardDescription className="text-gray-400">
                  This will clear your home country, favorites, preferred region, recently viewed history,
                  and all other personalization settings. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      Reset All Preferences
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/95 border-gray-800">
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                      <DialogDescription>
                        This will reset all your preferences to their defaults. Your home country,
                        favorite countries, preferred region, and recently viewed history will all be cleared.
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleResetAll}>
                        Yes, Reset Everything
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
  );
};

export default Settings;
