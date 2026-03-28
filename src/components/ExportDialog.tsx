import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Download,
  FileText,
  Table,
  FileJson,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

interface ExportFilters {
  country?: string;
  theme?: string;
  indicator?: string;
  yearRange?: [number, number];
}

interface ExportDialogProps {
  trigger?: React.ReactNode;
  filters?: ExportFilters;
}

const formatOptions: {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'csv',
    label: 'CSV',
    description: 'Comma-separated values',
    icon: Table,
  },
  {
    id: 'json',
    label: 'JSON',
    description: 'Structured data format',
    icon: FileJson,
  },
  {
    id: 'excel',
    label: 'Excel',
    description: 'Microsoft Excel spreadsheet',
    icon: FileSpreadsheet,
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Portable document format',
    icon: FileText,
  },
];

const ExportDialog = ({ trigger, filters }: ExportDialogProps) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const activeFilters = filters
    ? Object.entries(filters).filter(
        ([, value]) => value !== undefined && value !== null
      )
    : [];

  const formatFilterValue = (key: string, value: unknown): string => {
    if (key === 'yearRange' && Array.isArray(value)) {
      return `${value[0]} - ${value[1]}`;
    }
    return String(value);
  };

  const formatFilterLabel = (key: string): string => {
    const labels: Record<string, string> = {
      country: 'Country',
      theme: 'Theme',
      indicator: 'Indicator',
      yearRange: 'Year Range',
    };
    return labels[key] || key;
  };

  const handleExport = async () => {
    setIsExporting(true);

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 1800));

    setIsExporting(false);
    setOpen(false);

    toast({
      title: 'Export complete',
      description: `Your data has been exported as ${selectedFormat.toUpperCase()} successfully.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose a format and download your dataset.
          </DialogDescription>
        </DialogHeader>

        {/* Filter Summary */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Exporting data for:
            </p>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(([key, value]) => (
                <Badge key={key} variant="secondary">
                  {formatFilterLabel(key)}: {formatFilterValue(key, value)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {activeFilters.length === 0 && (
          <div className="rounded-md border border-dashed border-muted-foreground/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              No filters applied — all available data will be exported.
            </p>
          </div>
        )}

        {/* Format Selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Select format</p>
          <div className="grid grid-cols-2 gap-3">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;

              return (
                <button
                  key={format.id}
                  type="button"
                  onClick={() => setSelectedFormat(format.id)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors
                    ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-muted-foreground/40 hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {format.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Metadata Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-metadata"
            checked={includeMetadata}
            onCheckedChange={(checked) =>
              setIncludeMetadata(checked === true)
            }
          />
          <Label
            htmlFor="include-metadata"
            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Include metadata &amp; source attribution
          </Label>
        </div>

        {/* Download Button */}
        <Button
          className="w-full"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing export...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download {selectedFormat.toUpperCase()}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
