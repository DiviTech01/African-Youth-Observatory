import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

export interface PromiseItem { title: string; desc: string; stat: string }
export interface Legislation { name: string; year: string; status: 'active' | 'partial' | 'weak' | 'new'; reality: string }
export interface Recommendation { num: string; title: string; desc: string }

export interface PkpbGuidedValue {
  edition?: string;
  reviewedDate?: string;
  nextReview?: string;
  ayemiScore?: number;
  ayemiTier?: 'Critical' | 'Developing' | 'Fulfilling';
  executiveBrief?: string;
  pullQuote?: string;
  postQuote?: string;
  promiseKept: PromiseItem[];
  promiseBroken: PromiseItem[];
  recommendations: Recommendation[];
  legislation: Legislation[];
}

export const emptyPkpbValue = (): PkpbGuidedValue => ({
  promiseKept: [],
  promiseBroken: [],
  recommendations: [],
  legislation: [],
});

interface PkpbGuidedFormProps {
  value: PkpbGuidedValue;
  onChange: (v: PkpbGuidedValue) => void;
}

/**
 * Guided form replacement for the JSON-paste field. Builds the
 * `extractedSummary` payload that drives the country PKPB report card.
 *
 * Every field has a one-line helper underneath so contributors who haven't
 * seen the report card know what each value is for. Arrays (promises,
 * recommendations, legislation) support dynamic add/remove.
 */
const PkpbGuidedForm: React.FC<PkpbGuidedFormProps> = ({ value, onChange }) => {
  const set = <K extends keyof PkpbGuidedValue>(key: K, v: PkpbGuidedValue[K]) =>
    onChange({ ...value, [key]: v });

  const addPromise = (which: 'promiseKept' | 'promiseBroken') =>
    set(which, [...value[which], { title: '', desc: '', stat: '' }]);
  const updatePromise = (which: 'promiseKept' | 'promiseBroken', idx: number, field: keyof PromiseItem, val: string) => {
    const next = [...value[which]];
    next[idx] = { ...next[idx], [field]: val };
    set(which, next);
  };
  const removePromise = (which: 'promiseKept' | 'promiseBroken', idx: number) =>
    set(which, value[which].filter((_, i) => i !== idx));

  const addRec = () =>
    set('recommendations', [...value.recommendations, { num: String(value.recommendations.length + 1).padStart(2, '0'), title: '', desc: '' }]);
  const updateRec = (idx: number, field: keyof Recommendation, val: string) => {
    const next = [...value.recommendations];
    next[idx] = { ...next[idx], [field]: val };
    set('recommendations', next);
  };
  const removeRec = (idx: number) => set('recommendations', value.recommendations.filter((_, i) => i !== idx));

  const addLeg = () =>
    set('legislation', [...value.legislation, { name: '', year: '', status: 'active', reality: '' }]);
  const updateLeg = (idx: number, field: keyof Legislation, val: any) => {
    const next = [...value.legislation];
    next[idx] = { ...next[idx], [field]: val };
    set('legislation', next);
  };
  const removeLeg = (idx: number) => set('legislation', value.legislation.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      {/* ── Cover & metadata ── */}
      <fieldset className="space-y-4 rounded-md border border-white/[0.08] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-[#D4A017]">Cover &amp; metadata</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Edition</Label>
            <p className="text-[11px] text-gray-500">
              Shows in the gold pill at the top of the cover. Format: "Month Year · Vol XX".
            </p>
            <Input value={value.edition ?? ''} onChange={(e) => set('edition', e.target.value)} placeholder="Dec 2025 · Vol 01" />
          </div>
          <div className="space-y-1.5">
            <Label>Last reviewed</Label>
            <p className="text-[11px] text-gray-500">
              When this edition was finalised. Shown in the cover and footer.
            </p>
            <Input value={value.reviewedDate ?? ''} onChange={(e) => set('reviewedDate', e.target.value)} placeholder="December 2025" />
          </div>
          <div className="space-y-1.5">
            <Label>Next review</Label>
            <p className="text-[11px] text-gray-500">
              Planned date of the next edition. Sets reader expectations in the footer.
            </p>
            <Input value={value.nextReview ?? ''} onChange={(e) => set('nextReview', e.target.value)} placeholder="December 2026" />
          </div>
          <div />
          <div className="space-y-1.5">
            <Label>AYEMI score (0–100)</Label>
            <p className="text-[11px] text-gray-500">
              The composite African Youth Empowerment & Monitoring Index score. Drives the cover gauge and
              tier banner colour.
            </p>
            <Input
              type="number"
              min={0}
              max={100}
              value={value.ayemiScore ?? ''}
              onChange={(e) => set('ayemiScore', e.target.value === '' ? undefined : parseFloat(e.target.value))}
              placeholder="33"
            />
          </div>
          <div className="space-y-1.5">
            <Label>AYEMI tier</Label>
            <p className="text-[11px] text-gray-500">
              0–33% = Critical (red), 34–66% = Developing (gold), 67–100% = Fulfilling (green). Auto-derive
              if you leave blank.
            </p>
            <Select value={value.ayemiTier ?? ''} onValueChange={(v) => set('ayemiTier', v as any)}>
              <SelectTrigger><SelectValue placeholder="Auto-derive from score" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">Critical (0–33)</SelectItem>
                <SelectItem value="Developing">Developing (34–66)</SelectItem>
                <SelectItem value="Fulfilling">Fulfilling (67–100)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* ── Narrative ── */}
      <fieldset className="space-y-4 rounded-md border border-white/[0.08] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-[#D4A017]">Narrative</legend>

        <div className="space-y-1.5">
          <Label>Executive brief</Label>
          <p className="text-[11px] text-gray-500">
            The opening paragraph in section 01. Two to three paragraphs that summarise the country's youth
            outcomes — strengths, structural failures, and where the AYEMI score lands.
          </p>
          <Textarea rows={5} value={value.executiveBrief ?? ''} onChange={(e) => set('executiveBrief', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Pull quote</Label>
          <p className="text-[11px] text-gray-500">
            A single bolded sentence between the executive brief and the gauge. Memorable and citable. Keep
            under 200 characters.
          </p>
          <Textarea rows={2} value={value.pullQuote ?? ''} onChange={(e) => set('pullQuote', e.target.value)} placeholder="A generation grew up; the system did not." />
        </div>

        <div className="space-y-1.5">
          <Label>Closing paragraph</Label>
          <p className="text-[11px] text-gray-500">
            The text right after the pull quote — closes section 01 before the gauge. Usually one paragraph.
          </p>
          <Textarea rows={3} value={value.postQuote ?? ''} onChange={(e) => set('postQuote', e.target.value)} />
        </div>
      </fieldset>

      {/* ── Promise Kept ── */}
      <fieldset className="space-y-4 rounded-md border border-white/[0.08] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Promise Kept &nbsp;<span className="font-normal text-gray-500 normal-case">(commitments delivered)</span>
        </legend>
        <p className="text-xs text-gray-500 -mt-2">
          Each item is shown in the purple "Promise Kept" column on the report card — title, description,
          and a one-line statistic that makes it concrete.
        </p>
        {value.promiseKept.map((p, i) => (
          <div key={i} className="rounded border border-emerald-500/20 bg-emerald-500/[0.03] p-3 space-y-2 relative">
            <button type="button" onClick={() => removePromise('promiseKept', i)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="space-y-1">
              <Label className="text-xs">Title #{i + 1}</Label>
              <Input value={p.title} onChange={(e) => updatePromise('promiseKept', i, 'title', e.target.value)} placeholder="e.g. National Identity Coverage" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} value={p.desc} onChange={(e) => updatePromise('promiseKept', i, 'desc', e.target.value)} placeholder="Two-sentence explanation of what was delivered and why it matters." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Statistic chip</Label>
              <Input value={p.stat} onChange={(e) => updatePromise('promiseKept', i, 'stat', e.target.value)} placeholder="e.g. ~104M IDs · 47% of target" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addPromise('promiseKept')} className="gap-1.5">
          <Plus className="h-3 w-3" /> Add a Promise Kept item
        </Button>
      </fieldset>

      {/* ── Promise Broken ── */}
      <fieldset className="space-y-4 rounded-md border border-white/[0.08] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-red-400">
          Promise Broken &nbsp;<span className="font-normal text-gray-500 normal-case">(commitments not met)</span>
        </legend>
        <p className="text-xs text-gray-500 -mt-2">
          Each item is shown in the red "Promise Broken" column. These should pair to the Promise Kept items
          where possible — same domains, opposite outcomes.
        </p>
        {value.promiseBroken.map((p, i) => (
          <div key={i} className="rounded border border-red-500/20 bg-red-500/[0.03] p-3 space-y-2 relative">
            <button type="button" onClick={() => removePromise('promiseBroken', i)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="space-y-1">
              <Label className="text-xs">Title #{i + 1}</Label>
              <Input value={p.title} onChange={(e) => updatePromise('promiseBroken', i, 'title', e.target.value)} placeholder="e.g. Youth Unemployment Crisis" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} value={p.desc} onChange={(e) => updatePromise('promiseBroken', i, 'desc', e.target.value)} placeholder="What was promised, what happened instead." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Statistic chip</Label>
              <Input value={p.stat} onChange={(e) => updatePromise('promiseBroken', i, 'stat', e.target.value)} placeholder="e.g. 32% youth unemployment (2024)" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addPromise('promiseBroken')} className="gap-1.5">
          <Plus className="h-3 w-3" /> Add a Promise Broken item
        </Button>
      </fieldset>

      {/* ── Legislation ── */}
      <fieldset className="space-y-4 rounded-md border border-white/[0.08] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-amber-400">Legislation</legend>
        <p className="text-xs text-gray-500 -mt-2">
          Builds the Legislative Scorecard table (section 09). Each row scores a law, policy, or framework
          on its real-world youth-specific implementation — separate from whether it exists on paper.
        </p>
        {value.legislation.map((l, i) => (
          <div key={i} className="rounded border border-amber-500/20 bg-amber-500/[0.03] p-3 space-y-2 relative">
            <button type="button" onClick={() => removeLeg(i)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Name #{i + 1}</Label>
                <Input value={l.name} onChange={(e) => updateLeg(i, 'name', e.target.value)} placeholder="e.g. National Youth Policy" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Input value={l.year} onChange={(e) => updateLeg(i, 'year', e.target.value)} placeholder="2019 (revised 2023)" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={l.status} onValueChange={(v) => updateLeg(i, 'status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active — implemented</SelectItem>
                    <SelectItem value="partial">Partial — gaps in execution</SelectItem>
                    <SelectItem value="weak">Weak — paper only</SelectItem>
                    <SelectItem value="new">New — too recent to assess</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Youth-specific reality</Label>
                <p className="text-[11px] text-gray-500">One sentence on how this affects youth in practice.</p>
                <Textarea rows={2} value={l.reality} onChange={(e) => updateLeg(i, 'reality', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addLeg} className="gap-1.5">
          <Plus className="h-3 w-3" /> Add legislation row
        </Button>
      </fieldset>

      {/* ── Recommendations ── */}
      <fieldset className="space-y-4 rounded-md border border-white/[0.08] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-violet-400">Recommendations</legend>
        <p className="text-xs text-gray-500 -mt-2">
          The "Priorities for a New Compact" section (10) — structural, measurable, and time-bound asks. Two-column
          grid on the page; aim for 4–8 items.
        </p>
        {value.recommendations.map((r, i) => (
          <div key={i} className="rounded border border-violet-500/20 bg-violet-500/[0.03] p-3 space-y-2 relative">
            <button type="button" onClick={() => removeRec(i)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400">
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="grid grid-cols-[60px_1fr] gap-2">
              <div className="space-y-1">
                <Label className="text-xs">No.</Label>
                <Input value={r.num} onChange={(e) => updateRec(i, 'num', e.target.value)} className="text-center" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input value={r.title} onChange={(e) => updateRec(i, 'title', e.target.value)} placeholder="e.g. Pass a binding youth-quota framework" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea rows={2} value={r.desc} onChange={(e) => updateRec(i, 'desc', e.target.value)} placeholder="One- or two-sentence explanation, time-bound where possible." />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addRec} className="gap-1.5">
          <Plus className="h-3 w-3" /> Add recommendation
        </Button>
      </fieldset>
    </div>
  );
};

export default PkpbGuidedForm;
