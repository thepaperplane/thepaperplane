'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, FileText, Loader2, Upload } from 'lucide-react';

type Role = { id: string; title: string };
type Status = 'idle' | 'submitting' | 'success' | 'error';

const FIELD =
  'w-full rounded-[var(--radius-md)] glass glass-static px-4 text-[0.9375rem] text-ink ' +
  'placeholder:text-ink-3 outline-none transition-[box-shadow] duration-[var(--dur-control)] ' +
  'focus:shadow-[var(--glass-shadow-lifted),0_0_0_2px_var(--accent)]';

const LABEL = 'text-ink mb-1.5 block text-[0.875rem] font-medium';

/**
 * Application form. Picks up the role from `#apply-<id>` links on the page,
 * so "Apply for this role" lands here with the right role already chosen.
 */
export function ApplyForm({ roles }: { roles: Role[] }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const pick = () => {
      const m = window.location.hash.match(/^#apply-([0-9a-f-]{36})$/);
      if (m && roles.some((r) => r.id === m[1])) setRole(m[1]!);
    };
    pick();
    window.addEventListener('hashchange', pick);
    return () => window.removeEventListener('hashchange', pick);
  }, [roles]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (file) data.set('resume', file);
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/careers/apply', { method: 'POST', body: data });
      const result = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus('error');
        setMessage(result.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setStatus('success');
      setMessage(result.message ?? 'Thank you — your application is with us.');
      form.reset();
      setFile(null);
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Please email us instead.');
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-[var(--radius-lg)] bg-[rgb(12_106_52/0.08)] p-8 ring-1 ring-[rgb(12_106_52/0.2)] ring-inset"
        role="status"
      >
        <span className="bg-positive flex h-12 w-12 items-center justify-center rounded-full">
          <Check className="text-ground h-6 w-6" strokeWidth={2.6} />
        </span>
        <h3 className="text-ink mt-5 text-[1.1875rem] font-semibold">Application received</h3>
        <p className="text-ink-2 mt-2.5 text-[0.9375rem] leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="text-accent mt-5 inline-flex h-11 items-center text-[0.9375rem] font-semibold"
        >
          Apply for another role
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate encType="multipart/form-data">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="jobId" className={LABEL}>
            Role
          </label>
          <select
            id="jobId"
            name="jobId"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`${FIELD} h-12`}
          >
            <option value="">General application — any role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ap-name" className={LABEL}>
            Full name <span className="text-critical">*</span>
          </label>
          <input
            id="ap-name"
            name="name"
            required
            autoComplete="name"
            className={`${FIELD} h-12`}
          />
        </div>
        <div>
          <label htmlFor="ap-email" className={LABEL}>
            Email <span className="text-critical">*</span>
          </label>
          <input
            id="ap-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            spellCheck={false}
            className={`${FIELD} h-12`}
          />
        </div>
        <div>
          <label htmlFor="ap-phone" className={LABEL}>
            Phone
          </label>
          <input
            id="ap-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={`${FIELD} h-12`}
          />
        </div>
        <div>
          <label htmlFor="ap-city" className={LABEL}>
            City
          </label>
          <input
            id="ap-city"
            name="city"
            autoComplete="address-level2"
            className={`${FIELD} h-12`}
          />
        </div>
        <div>
          <label htmlFor="ap-portfolio" className={LABEL}>
            Portfolio or GitHub
          </label>
          <input
            id="ap-portfolio"
            name="portfolio"
            type="url"
            inputMode="url"
            placeholder="https://…"
            className={`${FIELD} h-12`}
          />
        </div>
        <div>
          <label htmlFor="ap-linkedin" className={LABEL}>
            LinkedIn
          </label>
          <input
            id="ap-linkedin"
            name="linkedin"
            type="url"
            inputMode="url"
            placeholder="https://linkedin.com/in/…"
            className={`${FIELD} h-12`}
          />
        </div>
        <div>
          <label htmlFor="ap-exp" className={LABEL}>
            Years of experience
          </label>
          <input
            id="ap-exp"
            name="experience"
            inputMode="decimal"
            placeholder="e.g. 2"
            className={`${FIELD} h-12`}
          />
        </div>
        <div>
          <span className={LABEL} id="cv-label">
            CV <span className="text-ink-3 font-normal">(PDF or Word, up to 5 MB)</span>
          </span>
          <label
            className={`${FIELD} flex h-12 cursor-pointer items-center gap-3`}
            aria-labelledby="cv-label"
          >
            {file ? (
              <FileText className="text-accent h-4 w-4 shrink-0" />
            ) : (
              <Upload className="text-ink-3 h-4 w-4 shrink-0" />
            )}
            <span className="text-ink-2 min-w-0 truncate text-[0.875rem]">
              {file ? file.name : 'Choose a file…'}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ap-note" className={LABEL}>
            Why you, in a few lines
          </label>
          <textarea
            id="ap-note"
            name="note"
            rows={5}
            className={`${FIELD} resize-y py-3`}
            placeholder="Something you built, filed or fixed that you are proud of, and what you would like to do here…"
          />
        </div>
      </div>

      <div aria-hidden="true" className="sr-only-focusable absolute h-px w-px overflow-hidden">
        <label htmlFor="ap-website">Website</label>
        <input id="ap-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="text-ink-2 mt-6 flex items-start gap-3 text-[0.8125rem] leading-relaxed">
        <input
          type="checkbox"
          name="consent"
          required
          className="h-6 w-6 shrink-0 accent-[var(--accent)]"
        />
        <span>
          I understand my details and CV are used only to consider this application, kept privately
          by The Paper Plane, and deleted on request — see the{' '}
          <a href="/privacy" className="link-underline text-accent font-medium">
            privacy notice
          </a>
          .
        </span>
      </label>

      {status === 'error' ? (
        <p role="alert" className="text-critical mt-5 text-[0.875rem]">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        data-magnetic="0.08"
        className="bg-accent hover:bg-accent-hover text-accent-ink mt-7 inline-flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-full px-7 text-base font-semibold shadow-[var(--shadow-soft)] transition-colors disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send application
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </>
        )}
      </button>
    </form>
  );
}
