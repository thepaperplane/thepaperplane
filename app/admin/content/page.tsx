import Link from 'next/link';
import { FileText, MousePointerClick } from 'lucide-react';
import { SubmitButton } from '@/components/admin/form-bits';
import { resetCopy } from '@/app/admin/_actions/site';
import { serviceClient } from '@/lib/supabase';
import { formatRelative } from '@/lib/utils';
import { ContentEditor } from '@/components/admin/content-editor';
import { EmptyState, PageHeader, Panel } from '@/components/admin/ui';
import { requireProfile, canEdit } from '@/lib/auth';
import { CONTENT_DEFAULTS, CONTENT_PAGES, loadContent, type ContentKey } from '@/lib/content';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Content' };

const PAGE_LABEL: Record<string, string> = {
  home: 'Home',
  knowledge: 'Knowledge Corner',
  calendar: 'Compliance Calendar',
  work: 'Work',
  about: 'About',
  contact: 'Contact',
};

export default async function AdminContentPage() {
  const profile = await requireProfile();
  const editable = canEdit(profile.role);
  const overrides = await loadContent();

  // Everything changed with the visual editor, newest first.
  const supabase = serviceClient();
  const formKeys = new Set(Object.keys(CONTENT_DEFAULTS));
  const visualEdits = supabase
    ? (
        (
          await supabase
            .from('content_blocks')
            .select('page, slot, label, kind, value, updated_at')
            .order('updated_at', { ascending: false })
        ).data ?? []
      ).filter((row) => !formKeys.has(`${row.page}.${row.slot}`))
    : [];

  const entries = Object.entries(CONTENT_DEFAULTS) as [
    ContentKey,
    (typeof CONTENT_DEFAULTS)[ContentKey],
  ][];

  return (
    <>
      <PageHeader
        title="Pages & copy"
        description="Change any wording on the website. The fastest way is visually: open the site, switch on editing, and click the text you want to change."
      />

      <Panel className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-5 px-6 py-6">
          <div className="flex items-start gap-4">
            <span className="bg-accent text-accent-ink grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
              <MousePointerClick className="h-5 w-5" />
            </span>
            <div>
              <p className="text-ink text-[1rem] font-semibold">Edit the website visually</p>
              <p className="text-ink-3 mt-1 max-w-[56ch] text-[0.875rem] leading-relaxed">
                Opens the live site with an editing bar. Every outlined piece of text can be clicked
                and retyped; Enter saves and publishes it. Images marked as editable can be replaced
                the same way. “Reset” on any field brings back the original wording.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="bg-ink text-ground inline-flex h-11 items-center rounded-[var(--radius-md)] px-5 text-[0.875rem] font-semibold"
          >
            Open the site in edit mode
          </Link>
        </div>
      </Panel>

      <Panel
        title={`Visual edits (${visualEdits.length})`}
        description="Wording changed on the live site. Reset restores what shipped with the site."
        className="mb-6"
      >
        {visualEdits.length === 0 ? (
          <p className="text-ink-3 px-6 py-5 text-[0.875rem]">
            Nothing changed yet — the site shows its original wording.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--hairline)]">
            {visualEdits.map((row) => {
              const v = row.value as unknown;
              const preview =
                typeof v === 'string'
                  ? v
                  : v && typeof v === 'object'
                    ? String(
                        (v as Record<string, unknown>).text ??
                          (v as Record<string, unknown>).url ??
                          '',
                      )
                    : '';
              return (
                <li key={`${row.page}.${row.slot}`} className="flex items-start gap-4 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-ink-3 text-[0.75rem]">
                      {row.label} · {formatRelative(row.updated_at)}
                    </p>
                    <p className="text-ink mt-1 line-clamp-2 text-[0.875rem]">{preview}</p>
                  </div>
                  {editable ? (
                    <form action={resetCopy}>
                      <input type="hidden" name="page" value={row.page} />
                      <input type="hidden" name="slot" value={row.slot} />
                      <SubmitButton
                        tone="quiet"
                        pendingText="…"
                        confirm="Restore the original wording?"
                      >
                        Reset
                      </SubmitButton>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {entries.length === 0 ? (
        <Panel>
          <EmptyState icon={FileText} title="No editable blocks defined" />
        </Panel>
      ) : (
        <div className="space-y-6">
          {CONTENT_PAGES.map((page) => {
            const pageEntries = entries.filter(([, def]) => def.page === page);
            if (pageEntries.length === 0) return null;

            return (
              <Panel
                key={page}
                title={PAGE_LABEL[page] ?? page}
                description={`/${page === 'home' ? '' : page}`}
              >
                <div className="divide-y divide-[var(--color-hairline)]">
                  {pageEntries.map(([key, def]) => (
                    <ContentEditor
                      key={key}
                      contentKey={key}
                      label={def.label}
                      defaultValue={def.value}
                      currentValue={overrides[key] ?? ''}
                      editable={editable}
                    />
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
