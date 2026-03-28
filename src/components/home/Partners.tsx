import React from 'react';
import { Logos3 } from '@/components/ui/logos3';

const partnerLogos = [
  {
    id: "au",
    description: "African Union",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/51/Flag_of_the_African_Union.svg",
    className: "h-10 w-auto",
  },
  {
    id: "undp",
    description: "United Nations Development Programme",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5d/UNDP_logo.svg",
    className: "h-10 w-auto",
  },
  {
    id: "unicef",
    description: "UNICEF",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Logo_of_UNICEF.svg",
    className: "h-10 w-auto",
  },
  {
    id: "who",
    description: "World Health Organization",
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c2/WHO_logo.svg",
    className: "h-10 w-auto",
  },
  {
    id: "worldbank",
    description: "World Bank",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/87/The_World_Bank_logo.svg",
    className: "h-10 w-auto",
  },
  {
    id: "ilo",
    description: "International Labour Organization",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0a/International_Labour_Organization_logo.svg",
    className: "h-10 w-auto",
  },
  {
    id: "afdb",
    description: "African Development Bank",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0d/African_Development_Bank_Logo.svg",
    className: "h-10 w-auto",
  },
  {
    id: "unesco",
    description: "UNESCO",
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_UNESCO_%282017%29.svg",
    className: "h-10 w-auto",
  },
];

const Partners = () => {
  return (
    <Logos3
      heading="Our Partners & Data Sources"
      logos={partnerLogos}
    />
  );
};

export default Partners;
