import { Quote } from 'lucide-react';
import { ADMIN_FIELD, EmptyState, Field, PageHeader, Panel, Pill } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { deleteTestimonial, saveTestimonial } from '@/app/admin/_actions/site';
import { requireProfile } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase';
import type { TestimonialRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Testimonials' };

function TestimonialForm({ t }: { t?: TestimonialRow }) {
  const id = t?.id ?? 'new';
  return (
    <form action={saveTestimonial} className="grid gap-4 px-6 py-5 md:grid-cols-2">
      {t ? <input type="hidden" name="id" value={t.id} /> : null}
      <div className="md:col-span-2">
        <Field
          label="What they said"
          htmlFor={`q-${id}`}
          required
          hint="Their words, exactly. 10 to 1,200 characters."
        >
          <textarea
            id={`q-${id}`}
            name="quote"
            required
            rows={3}
            defaultValue={t?.quote}
            className={`${ADMIN_FIELD} h-auto py-3`}
          />
        </Field>
      </div>
      <Field label="Name" htmlFor={`n-${id}`} required>
        <input
          id={`n-${id}`}
          name="author_name"
          required
          defaultValue={t?.author_name}
          className={ADMIN_FIELD}
        />
      </Field>
      <Field label="Role" htmlFor={`r-${id}`}>
        <input
          id={`r-${id}`}
          name="author_role"
          defaultValue={t?.author_role ?? ''}
          className={ADMIN_FIELD}
          placeholder="Founder"
        />
      </Field>
      <Field label="Company" htmlFor={`c-${id}`}>
        <input
          id={`c-${id}`}
          name="company"
          defaultValue={t?.company ?? ''}
          className={ADMIN_FIELD}
        />
      </Field>
      <Field label="Stars (optional)" htmlFor={`s-${id}`}>
        <select
          id={`s-${id}`}
          name="rating"
          defaultValue={String(t?.rating ?? 0)}
          className={ADMIN_FIELD}
        >
          <option value="0">No rating</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} stars
            </option>
          ))}
        </select>
      </Field>
      <div className="md:col-span-2">
        <Field
          label="Video link (optional)"
          htmlFor={`v-${id}`}
          hint="A YouTube, Instagram or Drive link to the client's video testimonial. It appears as a “Watch” link on the Our Work page and in web-development quotations. Nothing is embedded."
        >
          <input
            id={`v-${id}`}
            name="video_url"
            type="url"
            inputMode="url"
            defaultValue={t?.video_url ?? ''}
            placeholder="https://youtu.be/…"
            className={ADMIN_FIELD}
          />
        </Field>
      </div>
      <Field label="Photo (optional)" htmlFor={`a-${id}`} hint="Square image, PNG, JPG or WebP.">
        <input
          id={`a-${id}`}
          name="avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="text-ink-2 text-[0.8125rem]"
        />
      </Field>
      <Field label="Order" htmlFor={`p-${id}`} hint="Lower numbers show first.">
        <input
          id={`p-${id}`}
          name="position"
          type="number"
          min="0"
          defaultValue={t?.position ?? 0}
          className={ADMIN_FIELD}
        />
      </Field>
      <label className="text-ink flex items-center gap-2.5 text-[0.875rem] font-medium md:col-span-2">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={t?.is_published ?? true}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Show on the website
      </label>
      <div className="md:col-span-2">
        <SubmitButton>{t ? 'Save changes' : 'Add testimonial'}</SubmitButton>
      </div>
    </form>
  );
}

/**
 * Real words from real clients. The homepage section only appears once at
 * least one is published, so there is never placeholder praise on the site.
 */
export default async function TestimonialsPage() {
  await requireProfile();
  const supabase = serviceClient();
  let items: TestimonialRow[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('position')
      .order('created_at', { ascending: false });
    items = data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Published testimonials appear on the homepage. Ask for permission before publishing a client’s name."
      />
      <Panel title="Add a testimonial" className="mb-6">
        <TestimonialForm />
      </Panel>
      {items.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Quote}
            title="No testimonials yet"
            description="The homepage hides the section until you publish one."
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {items.map((t) => (
            <Panel
              key={t.id}
              title={`${t.author_name}${t.company ? `, ${t.company}` : ''}`}
              action={
                <Pill tone={t.is_published ? 'positive' : 'neutral'}>
                  {t.is_published ? 'Live' : 'Hidden'}
                </Pill>
              }
            >
              <details>
                <summary className="text-ink-2 cursor-pointer px-6 py-4 text-[0.9375rem] leading-relaxed">
                  “{t.quote}”
                </summary>
                <TestimonialForm t={t} />
                <form action={deleteTestimonial} className="px-6 pb-5">
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton tone="danger" confirm="Delete this testimonial?">
                    Delete
                  </SubmitButton>
                </form>
              </details>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
