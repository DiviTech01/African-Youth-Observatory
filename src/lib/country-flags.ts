// Country flag system using flagcdn.com CDN
// Maps country names to ISO 3166-1 alpha-2 codes for flag image URLs

export const countryToISO: Record<string, string> = {
  "Algeria": "dz",
  "Angola": "ao",
  "Benin": "bj",
  "Botswana": "bw",
  "Burkina Faso": "bf",
  "Burundi": "bi",
  "Cabo Verde": "cv",
  "Cameroon": "cm",
  "Central African Republic": "cf",
  "Chad": "td",
  "Comoros": "km",
  "Congo": "cg",
  "Côte d'Ivoire": "ci",
  "DRC": "cd",
  "Djibouti": "dj",
  "Egypt": "eg",
  "Equatorial Guinea": "gq",
  "Eritrea": "er",
  "Eswatini": "sz",
  "Ethiopia": "et",
  "Gabon": "ga",
  "Gambia": "gm",
  "Ghana": "gh",
  "Guinea": "gn",
  "Guinea-Bissau": "gw",
  "Kenya": "ke",
  "Lesotho": "ls",
  "Liberia": "lr",
  "Libya": "ly",
  "Madagascar": "mg",
  "Malawi": "mw",
  "Mali": "ml",
  "Mauritania": "mr",
  "Mauritius": "mu",
  "Morocco": "ma",
  "Mozambique": "mz",
  "Namibia": "na",
  "Niger": "ne",
  "Nigeria": "ng",
  "Rwanda": "rw",
  "São Tomé and Príncipe": "st",
  "Senegal": "sn",
  "Seychelles": "sc",
  "Sierra Leone": "sl",
  "Somalia": "so",
  "South Africa": "za",
  "South Sudan": "ss",
  "Sudan": "sd",
  "Tanzania": "tz",
  "Togo": "tg",
  "Tunisia": "tn",
  "Uganda": "ug",
  "Zambia": "zm",
  "Zimbabwe": "zw",
  // Aliases
  "Cape Verde": "cv",
  "Democratic Republic of the Congo": "cd",
  "Ivory Coast": "ci",
  "Swaziland": "sz",
};

// Country metadata: capital, languages, currency
export const countryMeta: Record<string, { capital: string; languages: string[]; currency: string; population: string; youthPop: string }> = {
  "Algeria": { capital: "Algiers", languages: ["Arabic", "Berber", "French"], currency: "DZD", population: "45.6M", youthPop: "8.2M" },
  "Angola": { capital: "Luanda", languages: ["Portuguese"], currency: "AOA", population: "36.7M", youthPop: "7.8M" },
  "Benin": { capital: "Porto-Novo", languages: ["French"], currency: "XOF", population: "13.4M", youthPop: "3.1M" },
  "Botswana": { capital: "Gaborone", languages: ["English", "Setswana"], currency: "BWP", population: "2.6M", youthPop: "0.5M" },
  "Burkina Faso": { capital: "Ouagadougou", languages: ["French"], currency: "XOF", population: "23.3M", youthPop: "5.4M" },
  "Burundi": { capital: "Gitega", languages: ["Kirundi", "French", "English"], currency: "BIF", population: "13.2M", youthPop: "3.0M" },
  "Cabo Verde": { capital: "Praia", languages: ["Portuguese"], currency: "CVE", population: "0.6M", youthPop: "0.1M" },
  "Cameroon": { capital: "Yaoundé", languages: ["French", "English"], currency: "XAF", population: "28.6M", youthPop: "6.3M" },
  "Central African Republic": { capital: "Bangui", languages: ["French", "Sango"], currency: "XAF", population: "5.7M", youthPop: "1.2M" },
  "Chad": { capital: "N'Djamena", languages: ["French", "Arabic"], currency: "XAF", population: "18.3M", youthPop: "4.0M" },
  "Comoros": { capital: "Moroni", languages: ["Comorian", "Arabic", "French"], currency: "KMF", population: "0.9M", youthPop: "0.2M" },
  "Congo": { capital: "Brazzaville", languages: ["French"], currency: "XAF", population: "6.1M", youthPop: "1.3M" },
  "Côte d'Ivoire": { capital: "Yamoussoukro", languages: ["French"], currency: "XOF", population: "28.9M", youthPop: "6.5M" },
  "DRC": { capital: "Kinshasa", languages: ["French", "Lingala", "Swahili", "Kikongo"], currency: "CDF", population: "102.3M", youthPop: "22.5M" },
  "Djibouti": { capital: "Djibouti", languages: ["French", "Arabic"], currency: "DJF", population: "1.1M", youthPop: "0.2M" },
  "Egypt": { capital: "Cairo", languages: ["Arabic"], currency: "EGP", population: "109.3M", youthPop: "19.7M" },
  "Equatorial Guinea": { capital: "Malabo", languages: ["Spanish", "French", "Portuguese"], currency: "XAF", population: "1.7M", youthPop: "0.3M" },
  "Eritrea": { capital: "Asmara", languages: ["Tigrinya", "Arabic", "English"], currency: "ERN", population: "3.7M", youthPop: "0.8M" },
  "Eswatini": { capital: "Mbabane", languages: ["English", "siSwati"], currency: "SZL", population: "1.2M", youthPop: "0.3M" },
  "Ethiopia": { capital: "Addis Ababa", languages: ["Amharic", "Oromo", "Tigrinya"], currency: "ETB", population: "126.5M", youthPop: "27.8M" },
  "Gabon": { capital: "Libreville", languages: ["French"], currency: "XAF", population: "2.4M", youthPop: "0.5M" },
  "Gambia": { capital: "Banjul", languages: ["English"], currency: "GMD", population: "2.7M", youthPop: "0.6M" },
  "Ghana": { capital: "Accra", languages: ["English", "Akan", "Ewe"], currency: "GHS", population: "34.1M", youthPop: "7.0M" },
  "Guinea": { capital: "Conakry", languages: ["French"], currency: "GNF", population: "14.2M", youthPop: "3.1M" },
  "Guinea-Bissau": { capital: "Bissau", languages: ["Portuguese"], currency: "XOF", population: "2.1M", youthPop: "0.5M" },
  "Kenya": { capital: "Nairobi", languages: ["English", "Swahili"], currency: "KES", population: "55.1M", youthPop: "11.6M" },
  "Lesotho": { capital: "Maseru", languages: ["English", "Sesotho"], currency: "LSL", population: "2.3M", youthPop: "0.5M" },
  "Liberia": { capital: "Monrovia", languages: ["English"], currency: "LRD", population: "5.4M", youthPop: "1.2M" },
  "Libya": { capital: "Tripoli", languages: ["Arabic"], currency: "LYD", population: "7.0M", youthPop: "1.2M" },
  "Madagascar": { capital: "Antananarivo", languages: ["Malagasy", "French"], currency: "MGA", population: "30.3M", youthPop: "6.7M" },
  "Malawi": { capital: "Lilongwe", languages: ["English", "Chichewa"], currency: "MWK", population: "20.9M", youthPop: "4.6M" },
  "Mali": { capital: "Bamako", languages: ["French", "Bambara"], currency: "XOF", population: "23.3M", youthPop: "5.1M" },
  "Mauritania": { capital: "Nouakchott", languages: ["Arabic", "French"], currency: "MRU", population: "4.9M", youthPop: "1.1M" },
  "Mauritius": { capital: "Port Louis", languages: ["English", "French", "Creole"], currency: "MUR", population: "1.3M", youthPop: "0.2M" },
  "Morocco": { capital: "Rabat", languages: ["Arabic", "Berber", "French"], currency: "MAD", population: "37.8M", youthPop: "6.4M" },
  "Mozambique": { capital: "Maputo", languages: ["Portuguese"], currency: "MZN", population: "33.9M", youthPop: "7.5M" },
  "Namibia": { capital: "Windhoek", languages: ["English", "Afrikaans", "Oshiwambo"], currency: "NAD", population: "2.6M", youthPop: "0.6M" },
  "Niger": { capital: "Niamey", languages: ["French", "Hausa"], currency: "XOF", population: "27.2M", youthPop: "6.0M" },
  "Nigeria": { capital: "Abuja", languages: ["English", "Hausa", "Yoruba", "Igbo"], currency: "NGN", population: "223.8M", youthPop: "46.9M" },
  "Rwanda": { capital: "Kigali", languages: ["Kinyarwanda", "English", "French"], currency: "RWF", population: "14.1M", youthPop: "3.0M" },
  "São Tomé and Príncipe": { capital: "São Tomé", languages: ["Portuguese"], currency: "STN", population: "0.2M", youthPop: "0.05M" },
  "Senegal": { capital: "Dakar", languages: ["French", "Wolof"], currency: "XOF", population: "17.9M", youthPop: "3.9M" },
  "Seychelles": { capital: "Victoria", languages: ["English", "French", "Creole"], currency: "SCR", population: "0.1M", youthPop: "0.02M" },
  "Sierra Leone": { capital: "Freetown", languages: ["English", "Krio"], currency: "SLL", population: "8.6M", youthPop: "1.9M" },
  "Somalia": { capital: "Mogadishu", languages: ["Somali", "Arabic"], currency: "SOS", population: "18.1M", youthPop: "4.0M" },
  "South Africa": { capital: "Pretoria", languages: ["Zulu", "Xhosa", "Afrikaans", "English"], currency: "ZAR", population: "60.4M", youthPop: "10.3M" },
  "South Sudan": { capital: "Juba", languages: ["English", "Arabic"], currency: "SSP", population: "11.4M", youthPop: "2.5M" },
  "Sudan": { capital: "Khartoum", languages: ["Arabic", "English"], currency: "SDG", population: "48.1M", youthPop: "10.1M" },
  "Tanzania": { capital: "Dodoma", languages: ["Swahili", "English"], currency: "TZS", population: "65.5M", youthPop: "14.4M" },
  "Togo": { capital: "Lomé", languages: ["French", "Ewe", "Kabye"], currency: "XOF", population: "9.0M", youthPop: "2.0M" },
  "Tunisia": { capital: "Tunis", languages: ["Arabic", "French"], currency: "TND", population: "12.5M", youthPop: "2.1M" },
  "Uganda": { capital: "Kampala", languages: ["English", "Swahili", "Luganda"], currency: "UGX", population: "48.6M", youthPop: "10.7M" },
  "Zambia": { capital: "Lusaka", languages: ["English", "Bemba", "Nyanja"], currency: "ZMW", population: "20.6M", youthPop: "4.5M" },
  "Zimbabwe": { capital: "Harare", languages: ["English", "Shona", "Ndebele"], currency: "ZWL", population: "16.7M", youthPop: "3.7M" },
};

/**
 * Get flag image URL for a country
 * @param country - Country name
 * @param width - Image width in pixels (20, 40, 80, 160, 320)
 * @returns Flag image URL or empty string if country not found
 */
export function getFlagUrl(country: string, width: number = 40): string {
  const iso = countryToISO[country];
  if (!iso) return '';
  return `https://flagcdn.com/w${width}/${iso}.png`;
}

/**
 * Get high-res flag image URL (2x for retina)
 */
export function getFlagSrcSet(country: string, width: number = 40): string {
  const iso = countryToISO[country];
  if (!iso) return '';
  return `https://flagcdn.com/w${width}/${iso}.png 1x, https://flagcdn.com/w${width * 2}/${iso}.png 2x`;
}

/**
 * Get country metadata
 */
export function getCountryMeta(country: string) {
  return countryMeta[country] || null;
}

/**
 * Get ISO code for a country
 */
export function getISOCode(country: string): string {
  return countryToISO[country] || '';
}
