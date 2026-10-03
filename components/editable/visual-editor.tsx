'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ImageUp, LayoutDashboard, Loader2, PenLine, RotateCcw, X } from 'lucide-react';

/**
 * The visual editor.
 *
 * Switch it on from the floating bar and every editable piece of text on the
 * page is outlined. Click one, type, press Enter (or click away) and it is
 * saved and published; Escape puts it back. Images marked editable open a
 * file picker. Nothing here writes to the page's data directly — it posts to
 * /api/admin/copy, which re-checks that the request comes from the console
 * owner with two-factor sign-in before touching the database.
 */

type Status = { tone: 'idle' | 'busy' | 'ok' | 'error'; text: string };

const STORAGE_KEY = 'pp.editing';

export function VisualEditor() {
  const router = useRouter();
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<Status>({ tone: 'idle', text: '' });
  const [active, setActive] = useState<{ key: string; rect: DOMRect } | null>(null);
  const editing = useRef<{ el: HTMLElement; key: string; original: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageKey = useRef<string | null>(null);

  useEffect(() => {
    try {
      setEnabled(sessionStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('pp-editing', enabled);
    try {
      sessionStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch {
      /* ignore */
    }
    return () => root.classList.remove('pp-editing');
  }, [enabled]);

  const flash = useCallback((s: Status, ms = 2600) => {
    setStatus(s);
    if (s.tone === 'ok' || s.tone === 'error') {
      window.setTimeout(
        () => setStatus((cur) => (cur === s ? { tone: 'idle', text: '' } : cur)),
        ms,
      );
    }
  }, []);

  const send = useCallback(async (method: 'POST' | 'DELETE', body: Record<string, string>) => {
    const res = await fetch('/api/admin/copy', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; value?: string };
    if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status})`);
    return data;
  }, []);

  const stop = useCallback((restore: boolean) => {
    const cur = editing.current;
    if (!cur) return;
    if (restore) cur.el.innerText = cur.original;
    cur.el.removeAttribute('contenteditable');
    editing.current = null;
    setActive(null);
  }, []);

  const commit = useCallback(async () => {
    const cur = editing.current;
    if (!cur) return;
    const value = cur.el.innerText
      .replace(/ /g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (value === cur.original.trim()) {
      stop(false);
      return;
    }
    if (!value) {
      flash({ tone: 'error', text: 'Text cannot be empty. Use “Reset” to restore the original.' });
      stop(true);
      return;
    }
    const { el, key } = cur;
    stop(false);
    el.setAttribute('data-edit-saving', '');
    flash({ tone: 'busy', text: 'Saving…' });
    try {
      await send('POST', { key, value });
      document
        .querySelectorAll<HTMLElement>(`[data-edit="${CSS.escape(key)}"]`)
        .forEach((node) => node !== el && (node.innerText = value));
      flash({ tone: 'ok', text: 'Saved and published' });
      router.refresh();
    } catch (e) {
      el.innerText = cur.original;
      flash({ tone: 'error', text: e instanceof Error ? e.message : 'Could not save' });
    } finally {
      el.removeAttribute('data-edit-saving');
    }
  }, [flash, router, send, stop]);

  const reset = useCallback(async () => {
    const cur = editing.current;
    if (!cur) return;
    const { key } = cur;
    stop(true);
    flash({ tone: 'busy', text: 'Restoring the original…' });
    try {
      await send('DELETE', { key });
      flash({ tone: 'ok', text: 'Original restored' });
      router.refresh();
    } catch (e) {
      flash({ tone: 'error', text: e instanceof Error ? e.message : 'Could not reset' });
    }
  }, [flash, router, send, stop]);

  const begin = useCallback(
    (el: HTMLElement) => {
      if (editing.current?.el === el) return;
      if (editing.current) void commit();
      const key = el.dataset.edit!;
      editing.current = { el, key, original: el.innerText };
      try {
        el.setAttribute('contenteditable', 'plaintext-only');
        if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
      } catch {
        el.setAttribute('contenteditable', 'true');
      }
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      setActive({ key, rect: el.getBoundingClientRect() });
    },
    [commit],
  );

  // Clicks: while editing is on, editable elements are captured before any
  // link or button they sit inside can act on the click.
  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest('[data-editor-ui]')) return;
      const img = target.closest<HTMLElement>('[data-edit-img]');
      if (img) {
        e.preventDefault();
        e.stopPropagation();
        imageKey.current = img.dataset.editImg ?? null;
        fileInput.current?.click();
        return;
      }
      const el = target.closest<HTMLElement>('[data-edit]');
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        begin(el);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const cur = editing.current;
      if (!cur) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        stop(true);
      } else if (e.key === 'Enter' && !e.shiftKey && !cur.el.hasAttribute('data-edit-multiline')) {
        e.preventDefault();
        void commit();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void commit();
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const cur = editing.current;
      if (!cur || e.target !== cur.el) return;
      const next = e.relatedTarget as HTMLElement | null;
      if (next?.closest('[data-editor-ui]')) return;
      void commit();
    };
    const onScroll = () => {
      const cur = editing.current;
      if (cur) setActive({ key: cur.key, rect: cur.el.getBoundingClientRect() });
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusout', onFocusOut, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusout', onFocusOut, true);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled, begin, commit, stop]);

  // Leaving the page or switching the editor off saves nothing half-typed.
  useEffect(() => {
    if (!enabled) stop(true);
  }, [enabled, stop]);
  useEffect(() => () => stop(true), [pathname, stop]);

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const key = imageKey.current;
    e.target.value = '';
    if (!file || !key) return;
    flash({ tone: 'busy', text: 'Uploading image…' });
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('key', key);
      const res = await fetch('/api/admin/media', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
      document
        .querySelectorAll<HTMLImageElement>(`[data-edit-img="${CSS.escape(key)}"]`)
        .forEach((img) => (img.src = data.url!));
      flash({ tone: 'ok', text: 'Image replaced and published' });
      router.refresh();
    } catch (err) {
      flash({ tone: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
    }
  }

  const count = enabled ? document.querySelectorAll('[data-edit], [data-edit-img]').length : 0;

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={onImage}
        aria-hidden="true"
        tabIndex={-1}
      />

      {active ? (
        <div
          data-editor-ui
          className="bg-ink text-ground fixed z-[95] flex items-center gap-1 rounded-full p-1 shadow-[var(--shadow-lift)]"
          style={{
            top: Math.max(8, active.rect.top - 48),
            left: Math.min(Math.max(8, active.rect.left), window.innerWidth - 300),
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void commit()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-semibold hover:bg-white/10"
          >
            <Check className="h-4 w-4" /> Save
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => stop(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] hover:bg-white/10"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void reset()}
            title="Remove the edit and restore the original wording"
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      ) : null}

      <div
        data-editor-ui
        role="region"
        aria-label="Visual editor"
        className="glass glass-thick fixed bottom-5 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2 rounded-full p-1.5 pl-4 shadow-[var(--glass-shadow-lifted)]"
      >
        <PenLine className="text-accent h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="text-ink hidden text-[0.8125rem] font-semibold sm:inline">
          {enabled ? 'Editing this page' : 'Edit this page'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Editing mode"
          onClick={() => setEnabled((v) => !v)}
          className={
            'relative h-7 w-12 shrink-0 rounded-full transition-colors ' +
            (enabled ? 'bg-accent' : 'bg-hairline-strong')
          }
        >
          <span
            className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: enabled ? 'translateX(20px)' : 'none' }}
          />
        </button>
        {status.text ? (
          <span
            role="status"
            className={
              'flex items-center gap-1.5 px-1 text-[0.8125rem] ' +
              (status.tone === 'error'
                ? 'text-critical'
                : status.tone === 'ok'
                  ? 'text-positive'
                  : 'text-ink-2')
            }
          >
            {status.tone === 'busy' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {status.text}
          </span>
        ) : enabled ? (
          <span className="text-ink-3 hidden px-1 text-[0.8125rem] md:inline">
            {count} editable · click to edit · Enter saves · Esc cancels
            <ImageUp className="ml-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
          </span>
        ) : null}
        <a
          href="/admin"
          className="bg-ink text-ground inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem] font-semibold"
        >
          <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
          Console
        </a>
      </div>
    </>
  );
}
