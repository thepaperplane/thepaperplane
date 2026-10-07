import { Camera, FileText, MapPin, MessageCircle, Mail, PenLine, UploadCloud } from 'lucide-react';
import type { ChecklistGroup, ChecklistKind } from '@/lib/quotes/types';
import './quote.css';

const KIND: Record<ChecklistKind, { label: string; Icon: typeof FileText }> = {
  doc: { label: 'Send a scan or photo', Icon: FileText },
  info: { label: 'Tell us', Icon: PenLine },
  photo: { label: 'Take a photo', Icon: Camera },
  location: { label: 'Share the location', Icon: MapPin },
};

/**
 * What the client needs to gather, as a numbered checklist: every item says
 * whether to send a document, tell us something, take a photo or share a map
 * pin, so nobody has to guess what “details” means.
 */
export function Checklist({ groups, title }: { groups: ChecklistGroup[]; title: string }) {
  let n = 0;
  const all = groups.flatMap((g) => g.items);
  const count = (k: ChecklistKind) => all.filter((x) => x.kind === k).length;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-ink font-[family-name:var(--font-sans)] text-[1rem] font-semibold tracking-normal">
          {title}
        </h4>
        <p className="text-ink-3 text-[0.8125rem]">
          {all.length} items
          {(['doc', 'info', 'photo', 'location'] as ChecklistKind[])
            .filter((k) => count(k))
            .map(
              (k) =>
                ` · ${count(k)} ${k === 'doc' ? 'documents' : k === 'info' ? 'details' : k === 'photo' ? 'photos' : 'locations'}`,
            )
            .join('')}
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        {groups.map((g) => {
          const start = n;
          n += g.items.length;
          return (
            <section key={g.title} className="bg-sunken rounded-[var(--radius-md)] p-4">
              <h5 className="text-ink-2 text-[0.75rem] font-semibold tracking-[0.07em] uppercase">
                {g.title}
              </h5>
              <ol start={start + 1} className="mt-3 grid gap-2">
                {g.items.map((it, idx) => {
                  const { Icon, label } = KIND[it.kind];
                  return (
                    <li
                      key={it.t}
                      value={start + idx + 1}
                      className="bg-surface flex items-start gap-3 rounded-[0.8rem] border border-[var(--hairline)] px-3 py-2.5"
                    >
                      <span
                        aria-hidden="true"
                        className="bg-accent text-accent-ink mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold"
                      >
                        {start + idx + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block text-[0.9375rem] leading-snug">{it.t}</span>
                        {it.note ? (
                          <span className="text-ink-3 mt-0.5 block text-[0.8125rem]">
                            {it.note}
                          </span>
                        ) : null}
                      </span>
                      <span className={`cl-kind cl-${it.kind} hidden sm:inline-flex`}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {label}
                      </span>
                      <span className="sr-only sm:hidden">({label})</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <div className="bg-accent-wash text-ink mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[var(--radius-md)] px-4 py-3 text-[0.8125rem] leading-relaxed">
        <span className="font-semibold">How to send</span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="text-accent h-4 w-4" aria-hidden="true" /> WhatsApp
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mail className="text-accent h-4 w-4" aria-hidden="true" /> Email
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UploadCloud className="text-accent h-4 w-4" aria-hidden="true" /> Your client portal
        </span>
        <span className="text-ink-2">
          Phone photos are fine — keep them clear, with all four corners showing.
        </span>
      </div>
    </div>
  );
}
