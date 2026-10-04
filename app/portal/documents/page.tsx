import { redirect } from 'next/navigation';
import { FileText, Upload } from 'lucide-react';
import { PortalCard } from '@/components/portal/ui';
import { getPortalSession } from '@/lib/portal/auth';
import { dateIN, documentsFor } from '@/lib/portal/data';

export const metadata = { title: 'Documents' };

const UPLOAD_NOTICE: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: 'Sent — the team has been told.' },
  empty: { ok: false, text: 'Choose a file first.' },
  type: {
    ok: false,
    text: 'That file could not be accepted. PDF, images, Word or Excel up to 20 MB.',
  },
  failed: { ok: false, text: 'The upload did not complete. Please try again.' },
};

export default async function PortalDocuments({
  searchParams,
}: {
  searchParams: Promise<{ upload?: string }>;
}) {
  const session = await getPortalSession();
  if (!session) redirect('/portal');
  const { upload } = await searchParams;
  const docs = await documentsFor(session.active.id);
  const notice = upload ? UPLOAD_NOTICE[upload] : null;
  const size = (b: number | null) => (b ? `${Math.max(1, Math.round(b / 1024))} KB` : '');

  return (
    <>
      <h1 className="text-[length:var(--text-title-1)] leading-[1.1]">Documents</h1>
      <p className="text-ink-2 mt-2 text-[0.9375rem]">
        What we have shared with you, and what you have sent us. Files are private; each link works
        for one minute.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <PortalCard title="Your documents">
          {docs.length ? (
            <ul className="divide-y divide-[var(--hairline)]">
              {docs.map((d) => (
                <li key={d.id}>
                  <a
                    href={`/api/portal/documents/${d.id}`}
                    className="hover:bg-sunken flex items-center gap-3 px-5 py-3"
                  >
                    <FileText className="text-ink-3 h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="text-ink block truncate text-[0.875rem] font-medium">
                        {d.title}
                      </span>
                      <span className="text-ink-3 block text-[0.75rem]">
                        {d.uploaded_by === 'client' ? 'Sent by you' : d.category} ·{' '}
                        {size(d.size_bytes)}
                      </span>
                    </span>
                    <span className="text-ink-3 text-[0.75rem]">{dateIN(d.created_at)}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-3 px-5 py-8 text-[0.875rem]">Nothing shared yet.</p>
          )}
        </PortalCard>

        <PortalCard title="Send us a document">
          <form
            action="/api/portal/documents"
            method="post"
            encType="multipart/form-data"
            className="grid gap-4 px-5 py-5"
          >
            <div>
              <label
                htmlFor="doc-title"
                className="text-ink mb-1.5 block text-[0.8125rem] font-medium"
              >
                What is it?
              </label>
              <input
                id="doc-title"
                name="title"
                maxLength={160}
                placeholder="e.g. Form 16 for 2025-26"
                className="bg-surface text-ink h-11 w-full rounded-[var(--radius-md)] px-3.5 text-[0.9375rem] ring-1 ring-[var(--hairline-strong)] ring-inset"
              />
            </div>
            <div>
              <label
                htmlFor="doc-file"
                className="text-ink mb-1.5 block text-[0.8125rem] font-medium"
              >
                File (PDF, image, Word or Excel, up to 20 MB)
              </label>
              <input
                id="doc-file"
                name="file"
                type="file"
                required
                className="text-ink-2 block w-full text-[0.875rem]"
              />
            </div>
            {notice ? (
              <p
                role="status"
                className={
                  notice.ok
                    ? 'text-positive text-[0.875rem] font-medium'
                    : 'text-critical text-[0.875rem]'
                }
              >
                {notice.text}
              </p>
            ) : null}
            <button
              type="submit"
              className="bg-accent hover:bg-accent-hover text-accent-ink inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.9375rem] font-semibold"
            >
              <Upload className="h-4 w-4" /> Send securely
            </button>
          </form>
        </PortalCard>
      </div>
    </>
  );
}
