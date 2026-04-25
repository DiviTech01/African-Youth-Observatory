import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const LanguageSwitcher = () => {
  const { language, languageInfo } = useLanguage();
  const { toast } = useToast();

  const handleSelect = (code: string) => {
    if (code === language) return;
    toast({
      title: 'Multi-language support coming soon',
      description: 'The platform is currently available in English only. Other languages are on the roadmap.',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs sm:text-sm">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{languageInfo.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={language === lang.code ? 'bg-accent font-medium' : ''}
          >
            {lang.nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
