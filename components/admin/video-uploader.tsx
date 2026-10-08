'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { ADMIN_FIELD, Field } from '@/components/admin/ui';
import { attachProjectVideo, createVideoUpload } from '@/app/admin/_actions/videos';
import { browserClient } from '@/lib/supabase-browser';

const MAX = 50 * 1024 * 1024;

/** Reads a video's own dimensions so the player can give it the right shape. */
function dimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      resolve({ width: v.videoWidth, height: v.videoHeight });
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });
}

export function VideoUploader({ projectId }: { projectId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [kind, setKind] = useState<'launch' | 'testimonial' | 'walkthrough'>('launch');
  const [title, setTitle] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = input.current?.files?.[0];
    if (!file || busy) return;
    if (file.size > MAX) {
      setMessage({
        ok: false,
        text: 'That video is over 50 MB. Compress it (for example to 1080p) and try again.',
      });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const [{ width, height }, ticket] = await Promise.all([
        dimensions(file),
        createVideoUpload({ projectId, type: file.type, size: file.size }),
      ]);
      if (!ticket.ok) throw new Error(ticket.message);
      const { error } = await browserClient()
        .storage.from('work-videos')
        .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
      if (error) throw new Error('The upload did not complete. Please try again.');
      const res = await attachProjectVideo({
        projectId,
        path: ticket.path,
        kind,
        orientation,
        title,
        width,
        height,
      });
      setMessage({ ok: res.ok, text: res.message });
      if (res.ok) {
        setTitle('');
        if (input.current) input.current.value = '';
        router.refresh();
      }
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <Field label="Video file" htmlFor={`vf-${projectId}`} hint="MP4, WebM or MOV, up to 50 MB.">
        <input
          ref={input}
          id={`vf-${projectId}`}
          type="file"
          required
          accept="video/mp4,video/webm,video/quicktime"
          onChange={async (e) => {
            // Suggest the shape from the footage itself; the owner can still change it.
            const f = e.target.files?.[0];
            if (!f) return;
            const { width, height } = await dimensions(f);
            if (width && height) setOrientation(height > width ? 'portrait' : 'landscape');
          }}
          className="text-ink-2 text-[0.8125rem]"
        />
      </Field>
      <Field label="What it is" htmlFor={`vk-${projectId}`}>
        <select
          id={`vk-${projectId}`}
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className={ADMIN_FIELD}
        >
          <option value="launch">Launch film</option>
          <option value="testimonial">Client testimonial</option>
          <option value="walkthrough">Walkthrough</option>
        </select>
      </Field>
      <Field
        label="Shape on the website"
        htmlFor={`vo-${projectId}`}
        hint="Landscape plays wide (16:9). Portrait plays tall (9:16), like a phone video. Set from the file automatically — change it if you prefer."
      >
        <select
          id={`vo-${projectId}`}
          value={orientation}
          onChange={(e) => setOrientation(e.target.value as typeof orientation)}
          className={ADMIN_FIELD}
        >
          <option value="landscape">Landscape (wide)</option>
          <option value="portrait">Portrait (tall)</option>
        </select>
      </Field>
      <div className="md:col-span-2">
        <Field
          label="Title (optional)"
          htmlFor={`vt-${projectId}`}
          hint="Shown above the video. Leave blank to use the type."
        >
          <input
            id={`vt-${projectId}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className={ADMIN_FIELD}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-accent text-accent-ink hover:bg-accent-hover inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-semibold disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? 'Uploading… this can take a minute' : 'Upload the video'}
        </button>
        {message ? (
          <p
            role="status"
            className={
              message.ok ? 'text-positive text-[0.875rem]' : 'text-critical text-[0.875rem]'
            }
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
