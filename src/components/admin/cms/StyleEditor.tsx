import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ContentStyles } from '@/services/content';

interface StyleEditorProps {
  value: ContentStyles;
  onChange: (next: ContentStyles) => void;
}

const FONT_WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
const FONT_STYLES = ['normal', 'italic'];
const ALIGNMENTS = ['left', 'center', 'right', 'justify'];
const DECORATIONS = ['none', 'underline', 'line-through', 'overline'];
const TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'];

export const StyleEditor: React.FC<StyleEditorProps> = ({ value, onChange }) => {
  const set = <K extends keyof ContentStyles>(key: K, v: ContentStyles[K] | undefined) => {
    const next = { ...value };
    if (v === undefined || v === '' || v === null) delete next[key];
    else next[key] = v;
    onChange(next);
  };

  const clearAll = () => onChange({});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Overrides applied on top of the page's default styling.
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={clearAll} className="h-7">
          <X className="mr-1 h-3 w-3" /> Clear all
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cms-color">Text color</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              id="cms-color"
              type="color"
              className="h-9 w-16 p-1"
              value={value.color ?? '#000000'}
              onChange={(e) => set('color', e.target.value)}
            />
            <Input
              value={value.color ?? ''}
              onChange={(e) => set('color', e.target.value)}
              placeholder="e.g. #4CAF50 or rgb(…)"
              className="h-9 flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cms-bg">Background color</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              id="cms-bg"
              type="color"
              className="h-9 w-16 p-1"
              value={value.backgroundColor ?? '#ffffff'}
              onChange={(e) => set('backgroundColor', e.target.value)}
            />
            <Input
              value={value.backgroundColor ?? ''}
              onChange={(e) => set('backgroundColor', e.target.value)}
              placeholder="transparent, #fff, …"
              className="h-9 flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cms-fs">Font size</Label>
          <Input
            id="cms-fs"
            value={value.fontSize ?? ''}
            onChange={(e) => set('fontSize', e.target.value)}
            placeholder="16px, 1.25rem, …"
            className="mt-1 h-9"
          />
        </div>

        <div>
          <Label htmlFor="cms-lh">Line height</Label>
          <Input
            id="cms-lh"
            value={value.lineHeight ?? ''}
            onChange={(e) => set('lineHeight', e.target.value)}
            placeholder="1.5"
            className="mt-1 h-9"
          />
        </div>

        <div>
          <Label>Font weight</Label>
          <Select value={value.fontWeight ?? ''} onValueChange={(v) => set('fontWeight', v || undefined)}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue placeholder="default" />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Font style</Label>
          <Select value={value.fontStyle ?? ''} onValueChange={(v) => set('fontStyle', v || undefined)}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue placeholder="default" />
            </SelectTrigger>
            <SelectContent>
              {FONT_STYLES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Text align</Label>
          <Select value={value.textAlign ?? ''} onValueChange={(v) => set('textAlign', v || undefined)}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue placeholder="default" />
            </SelectTrigger>
            <SelectContent>
              {ALIGNMENTS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cms-ls">Letter spacing</Label>
          <Input
            id="cms-ls"
            value={value.letterSpacing ?? ''}
            onChange={(e) => set('letterSpacing', e.target.value)}
            placeholder="0.02em"
            className="mt-1 h-9"
          />
        </div>

        <div>
          <Label>Decoration</Label>
          <Select
            value={value.textDecoration ?? ''}
            onValueChange={(v) => set('textDecoration', v || undefined)}
          >
            <SelectTrigger className="mt-1 h-9">
              <SelectValue placeholder="default" />
            </SelectTrigger>
            <SelectContent>
              {DECORATIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Text transform</Label>
          <Select
            value={value.textTransform ?? ''}
            onValueChange={(v) => set('textTransform', v || undefined)}
          >
            <SelectTrigger className="mt-1 h-9">
              <SelectValue placeholder="default" />
            </SelectTrigger>
            <SelectContent>
              {TRANSFORMS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default StyleEditor;
