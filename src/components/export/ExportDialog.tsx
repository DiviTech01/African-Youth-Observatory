// ============================================
// EXPORT DIALOG COMPONENT
// User-friendly export interface with format selection
// ============================================

import { useState } from 'react';
import { useExportGuard } from '@/hooks/useExportGuard';
import { GuestInviteModal } from '@/components/GuestInviteModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, FileJson, FileText, Check } from 'lucide-react';
import type { ExportFormat } from '@/services/export';

interface ExportDialogProps {
  title: string;
  description: string;
  onExport: (format: ExportFormat) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

interface QuickExportDropdownProps {
  onExport: (format: ExportFormat) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

const formatOptions: { value: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'csv',
    label: 'CSV',
    icon: <FileText className="h-4 w-4" />,
    description: 'Comma-separated values, compatible with all spreadsheet applications'
  },
  {
    value: 'excel',
    label: 'Excel',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: 'Microsoft Excel format with styled headers'
  },
  {
    value: 'json',
    label: 'JSON',
    icon: <FileJson className="h-4 w-4" />,
    description: 'Structured data format for developers and data analysis'
  }
];

export const ExportDialog = ({
  title,
  description,
  onExport,
  trigger,
  disabled = false
}: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const { guard, inviteOpen, setInviteOpen, inviteAction } = useExportGuard();

  const runExport = async () => {
    setExporting(true);
    try {
      await onExport(format);
      setExported(true);
      setTimeout(() => {
        setExported(false);
        setOpen(false);
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => guard(runExport, 'export');

  return (
    <>
    <GuestInviteModal open={inviteOpen} onOpenChange={setInviteOpen} action={inviteAction} />
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={disabled}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {formatOptions.find(f => f.value === format)?.description}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || exported}>
            {exported ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Downloaded
              </>
            ) : exporting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

// ============================================
// QUICK EXPORT DROPDOWN
// For inline export buttons with format selection
// ============================================

export const QuickExportDropdown = ({
  onExport,
  trigger,
  disabled = false
}: QuickExportDropdownProps) => {
  const { guard, inviteOpen, setInviteOpen, inviteAction } = useExportGuard();

  return (
    <>
      <GuestInviteModal open={inviteOpen} onOpenChange={setInviteOpen} action={inviteAction} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" disabled={disabled}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {formatOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => guard(() => onExport(option.value), 'export')}
              className="cursor-pointer"
            >
              {option.icon}
              <span className="ml-2">Export as {option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ExportDialog;
