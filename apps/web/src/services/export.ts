// ============================================
// AFRICAN YOUTH OBSERVATORY - EXPORT SERVICE
// Data export utilities for CSV, Excel, JSON, PDF
// ============================================

import { getCountryById, getIndicatorById, AFRICAN_COUNTRIES } from '@/types';

// ============================================
// TYPES
// ============================================

export type ExportFormat = 'csv' | 'json' | 'excel';

export interface ExportOptions {
  filename: string;
  format: ExportFormat;
  includeHeaders?: boolean;
  dateFormat?: string;
}

export interface TableExportData {
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

// ============================================
// CSV EXPORT
// ============================================

/**
 * Converts data to CSV format and triggers download
 */
export const exportToCSV = (data: TableExportData, filename: string): void => {
  const { headers, rows } = data;
  
  // Escape CSV values
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  // Build CSV content
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
  
  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadBlob(blob, `${filename}.csv`);
};

// ============================================
// JSON EXPORT
// ============================================

/**
 * Converts data to JSON format and triggers download
 */
export const exportToJSON = <T>(data: T, filename: string): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  
  downloadBlob(blob, `${filename}.json`);
};

// ============================================
// EXCEL EXPORT (Simple XML format)
// ============================================

/**
 * Converts data to Excel XML format and triggers download
 * Uses SpreadsheetML format which Excel can open
 */
export const exportToExcel = (data: TableExportData, filename: string): void => {
  const { headers, rows } = data;
  
  // Escape XML values
  const escapeXML = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  // Determine cell type
  const getCellType = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return 'String';
    if (typeof value === 'number') return 'Number';
    if (!isNaN(Number(value)) && value !== '') return 'Number';
    return 'String';
  };
  
  // Build XML content
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Size="12"/>
      <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Data">
      <Font ss:Size="11"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Data">
    <Table>
      <Row>
        ${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`).join('\n        ')}
      </Row>
      ${rows.map(row => `
      <Row>
        ${row.map(cell => `<Cell ss:StyleID="Data"><Data ss:Type="${getCellType(cell)}">${escapeXML(cell)}</Data></Cell>`).join('\n        ')}
      </Row>`).join('')}
    </Table>
  </Worksheet>
</Workbook>`;
  
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  
  downloadBlob(blob, `${filename}.xls`);
};

// ============================================
// YOUTH INDEX EXPORT
// ============================================

export interface YouthIndexExportItem {
  rank: number;
  countryId: string;
  indexScore: number;
  educationScore?: number;
  healthScore?: number;
  employmentScore?: number;
  civicScore?: number;
  innovationScore?: number;
}

/**
 * Export Youth Index rankings data
 */
export const exportYouthIndexRankings = (
  data: YouthIndexExportItem[],
  year: number,
  format: ExportFormat = 'csv'
): void => {
  const filename = `african-youth-index-${year}`;
  
  const tableData: TableExportData = {
    headers: [
      'Rank',
      'Country',
      'ISO Code',
      'Region',
      'Overall Score',
      'Education',
      'Health',
      'Employment',
      'Civic',
      'Innovation'
    ],
    rows: data.map(item => {
      const country = getCountryById(item.countryId);
      return [
        item.rank,
        country?.name || item.countryId,
        country?.iso2Code || '',
        country?.region || '',
        item.indexScore?.toFixed(1),
        item.educationScore?.toFixed(1) || '',
        item.healthScore?.toFixed(1) || '',
        item.employmentScore?.toFixed(1) || '',
        item.civicScore?.toFixed(1) || '',
        item.innovationScore?.toFixed(1) || ''
      ];
    })
  };
  
  switch (format) {
    case 'json':
      exportToJSON(data.map(item => {
        const country = getCountryById(item.countryId);
        return {
          rank: item.rank,
          country: country?.name,
          isoCode: country?.iso2Code,
          region: country?.region,
          overallScore: item.indexScore,
          dimensions: {
            education: item.educationScore,
            health: item.healthScore,
            employment: item.employmentScore,
            civic: item.civicScore,
            innovation: item.innovationScore
          }
        };
      }), filename);
      break;
    case 'excel':
      exportToExcel(tableData, filename);
      break;
    default:
      exportToCSV(tableData, filename);
  }
};

// ============================================
// COUNTRY PROFILE EXPORT
// ============================================

export interface CountryProfileExportData {
  countryId: string;
  year: number;
  indicators: {
    indicatorId: string;
    value: number;
    formattedValue?: string;
  }[];
  youthIndex?: YouthIndexExportItem;
}

/**
 * Export country profile data
 */
export const exportCountryProfile = (
  data: CountryProfileExportData,
  format: ExportFormat = 'csv'
): void => {
  const country = getCountryById(data.countryId);
  const filename = `${country?.name?.toLowerCase().replace(/\s+/g, '-') || data.countryId}-youth-profile-${data.year}`;
  
  const tableData: TableExportData = {
    headers: ['Indicator', 'Category', 'Value', 'Unit'],
    rows: data.indicators.map(ind => {
      const indicator = getIndicatorById(ind.indicatorId);
      return [
        indicator?.name || ind.indicatorId,
        indicator?.themeId || '',
        ind.value?.toFixed(2),
        indicator?.unit || ''
      ];
    })
  };
  
  switch (format) {
    case 'json':
      exportToJSON({
        country: country?.name,
        year: data.year,
        population: country?.population,
        youthPopulation: country?.youthPopulation,
        indicators: data.indicators.map(ind => {
          const indicator = getIndicatorById(ind.indicatorId);
          return {
            name: indicator?.name,
            category: indicator?.themeId,
            value: ind.value,
            unit: indicator?.unit
          };
        }),
        youthIndex: data.youthIndex
      }, filename);
      break;
    case 'excel':
      exportToExcel(tableData, filename);
      break;
    default:
      exportToCSV(tableData, filename);
  }
};

// ============================================
// INDICATOR DATA EXPORT
// ============================================

export interface IndicatorExportData {
  indicatorId: string;
  year: number;
  values: {
    countryId: string;
    value: number;
  }[];
}

/**
 * Export indicator data across countries
 */
export const exportIndicatorData = (
  data: IndicatorExportData,
  format: ExportFormat = 'csv'
): void => {
  const indicator = getIndicatorById(data.indicatorId);
  const filename = `${indicator?.name?.toLowerCase().replace(/\s+/g, '-') || data.indicatorId}-${data.year}`;
  
  const tableData: TableExportData = {
    headers: ['Country', 'ISO Code', 'Region', 'Value', 'Unit'],
    rows: data.values.map(v => {
      const country = getCountryById(v.countryId);
      return [
        country?.name || v.countryId,
        country?.iso2Code || '',
        country?.region || '',
        v.value?.toFixed(2),
        indicator?.unit || ''
      ];
    })
  };
  
  switch (format) {
    case 'json':
      exportToJSON({
        indicator: indicator?.name,
        year: data.year,
        unit: indicator?.unit,
        methodology: indicator?.methodology,
        values: data.values.map(v => {
          const country = getCountryById(v.countryId);
          return {
            country: country?.name,
            isoCode: country?.iso2Code,
            region: country?.region,
            value: v.value
          };
        })
      }, filename);
      break;
    case 'excel':
      exportToExcel(tableData, filename);
      break;
    default:
      exportToCSV(tableData, filename);
  }
};

// ============================================
// TIME SERIES EXPORT
// ============================================

export interface TimeSeriesExportData {
  countryId: string;
  indicatorId: string;
  data: {
    year: number;
    value: number;
  }[];
}

/**
 * Export time series data
 */
export const exportTimeSeries = (
  data: TimeSeriesExportData,
  format: ExportFormat = 'csv'
): void => {
  const country = getCountryById(data.countryId);
  const indicator = getIndicatorById(data.indicatorId);
  const filename = `${country?.name?.toLowerCase().replace(/\s+/g, '-')}-${indicator?.name?.toLowerCase().replace(/\s+/g, '-')}-timeseries`;
  
  const tableData: TableExportData = {
    headers: ['Year', 'Value'],
    rows: data.data.map(d => [d.year, d.value?.toFixed(2)])
  };
  
  switch (format) {
    case 'json':
      exportToJSON({
        country: country?.name,
        indicator: indicator?.name,
        unit: indicator?.unit,
        timeSeries: data.data
      }, filename);
      break;
    case 'excel':
      exportToExcel(tableData, filename);
      break;
    default:
      exportToCSV(tableData, filename);
  }
};

// ============================================
// COMPARISON EXPORT
// ============================================

export interface ComparisonExportData {
  countries: string[];
  indicatorId: string;
  year: number;
  values: {
    countryId: string;
    value: number;
  }[];
}

/**
 * Export comparison data
 */
export const exportComparisonData = (
  data: ComparisonExportData,
  format: ExportFormat = 'csv'
): void => {
  const indicator = getIndicatorById(data.indicatorId);
  const countryNames = data.countries.map(id => getCountryById(id)?.name || id).join('-vs-');
  const filename = `comparison-${countryNames}-${indicator?.name?.toLowerCase().replace(/\s+/g, '-') || data.indicatorId}`;
  
  const tableData: TableExportData = {
    headers: ['Country', 'Region', 'Value', 'Unit'],
    rows: data.values.map(v => {
      const country = getCountryById(v.countryId);
      return [
        country?.name || v.countryId,
        country?.region || '',
        v.value?.toFixed(2),
        indicator?.unit || ''
      ];
    })
  };
  
  switch (format) {
    case 'json':
      exportToJSON({
        indicator: indicator?.name,
        year: data.year,
        comparison: data.values.map(v => {
          const country = getCountryById(v.countryId);
          return {
            country: country?.name,
            value: v.value
          };
        })
      }, filename);
      break;
    case 'excel':
      exportToExcel(tableData, filename);
      break;
    default:
      exportToCSV(tableData, filename);
  }
};

// ============================================
// ALL COUNTRIES EXPORT
// ============================================

/**
 * Export all 54 African countries basic data
 */
export const exportAllCountries = (format: ExportFormat = 'csv'): void => {
  const filename = 'african-countries-database';
  
  const tableData: TableExportData = {
    headers: [
      'Country',
      'ISO2 Code',
      'ISO3 Code',
      'Capital',
      'Region',
      'Total Population',
      'Youth Population',
      'Youth %',
      'Area (km²)',
      'Currency',
      'Languages',
      'Economic Blocs'
    ],
    rows: AFRICAN_COUNTRIES.map(c => [
      c.name,
      c.iso2Code,
      c.isoCode,
      c.capital,
      c.region,
      c.population,
      c.youthPopulation,
      c.youthPercentage?.toFixed(1),
      c.area,
      c.currency,
      c.languages.join('; '),
      c.economicBlocks.join('; ')
    ])
  };
  
  switch (format) {
    case 'json':
      exportToJSON(AFRICAN_COUNTRIES.map(c => ({
        name: c.name,
        iso2Code: c.iso2Code,
        iso3Code: c.isoCode,
        capital: c.capital,
        region: c.region,
        population: c.population,
        youthPopulation: c.youthPopulation,
        youthPercentage: c.youthPercentage,
        area: c.area,
        currency: c.currency,
        languages: c.languages,
        economicBlocks: c.economicBlocks,
        coordinates: c.coordinates
      })), filename);
      break;
    case 'excel':
      exportToExcel(tableData, filename);
      break;
    default:
      exportToCSV(tableData, filename);
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Download blob as file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate timestamp for filenames
 */
export const getExportTimestamp = (): string => {
  return new Date().toISOString().slice(0, 10);
};
