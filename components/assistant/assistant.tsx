'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ArrowUp, Check, MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The site assistant: a launcher in the corner and a conversation panel.
 *
 * Replies stream in from /api/assistant as they are written. Markdown is
 * rendered by a deliberately tiny parser — bold, list items and links — and
 * nothing else, so a reply can never inject markup. Links are only followed
 * to this site, WhatsApp, email and phone.
 *
 * The conversation lives in sessionStorage for the visit, so moving between
 * pages keeps it; the server keeps its own copy, which is the one it trusts.
 */

type Msg = { role: 'user' | 'assistant'; content: string };

const STORE = 'pp.assistant.v1';

const STARTERS = [
  'What does your GST service include?',
  'I have received an income tax notice',
  'Can you build a website for my business?',
  'When is GSTR-3B due?',
];

export function Assistant({
  greeting,
  whatsapp,
  botNumber = '',
}: {
  greeting: string;
  whatsapp: string;
  /** The WhatsApp assistant's number; when set, the chat can continue there. */
  botNumber?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lead, setLead] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Restore the visit's conversation.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? 'null') as {
        id: string | null;
        messages: Msg[];
        lead?: boolean;
      } | null;
      if (saved?.messages?.length) {
        setMessages(saved.messages);
        setConversationId(saved.id);
        setLead(Boolean(saved.lead));
      }
    } catch {
      /* storage unavailable — start fresh */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ id: conversationId, messages, lead }));
    } catch {
      /* ignore */
    }
  }, [conversationId, messages, lead]);

  useEffect(() => {
    if (open) window.setTimeout(() => field.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => launcher.current?.focus(), 30);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setError('');
    setInput('');
    setBusy(true);
    const history = messages.slice(-12);
    setMessages((m) => [...m, { role: 'user', content: message }]);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          message,
          page: pathname,
          history,
        }),
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'The assistant could not answer just now.');
      }

      setMessages((m) => [...m, { role: 'assistant', content: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line) as { t: string; v?: string; id?: string; message?: string };
          if (evt.t === 'meta' && evt.id) setConversationId(evt.id);
          else if (evt.t === 'd' && evt.v) {
            const piece = evt.v;
            setMessages((m) => {
              const next = m.slice();
              const last = next[next.length - 1];
              if (last?.role === 'assistant') {
                next[next.length - 1] = { ...last, content: last.content + piece };
              }
              return next;
            });
          } else if (evt.t === 'lead') setLead(true);
          else if (evt.t === 'error') throw new Error(evt.message ?? 'Something went wrong.');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      // Drop an empty reply bubble left by a failed stream.
      setMessages((m) =>
        m.length && m[m.length - 1]!.role === 'assistant' && !m[m.length - 1]!.content
          ? m.slice(0, -1)
          : m,
      );
    } finally {
      setBusy(false);
      window.setTimeout(() => field.current?.focus(), 30);
    }
  };

  const reset = () => {
    setMessages([]);
    setConversationId(null);
    setLead(false);
    setError('');
  };

  const waiting = busy && messages[messages.length - 1]?.role === 'user';

  return (
    <>
      <button
        ref={launcher}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={open ? `${titleId}-panel` : undefined}
        className={cn('pa-launcher', open && 'pa-launcher-open')}
      >
        <span className="pa-launcher-icon" aria-hidden="true">
          {open ? <X className="h-5 w-5" strokeWidth={2.2} /> : <PlaneIcon />}
        </span>
        <span className="pa-launcher-text">{open ? 'Close' : 'Ask The Paper Plane'}</span>
      </button>

      {open ? (
        <section
          id={`${titleId}-panel`}
          role="dialog"
          aria-labelledby={titleId}
          className="pa-panel"
        >
          <header className="pa-head">
            <span className="pa-avatar" aria-hidden="true">
              <PlaneIcon />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="pa-title">
                The Paper Plane
              </h2>
              <p className="pa-sub">Answers from this website · replies in seconds</p>
            </div>
            {messages.length ? (
              <button type="button" onClick={reset} className="pa-ghost">
                New chat
              </button>
            ) : null}
            <button
              type="button"
              onClick={close}
              className="pa-icon"
              aria-label="Close the assistant"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>

          <div ref={log} className="pa-log" role="log" aria-live="polite" aria-relevant="additions">
            <Bubble role="assistant" content={greeting} />
            {!messages.length ? (
              <div className="pa-starters">
                {STARTERS.map((s) => (
                  <button key={s} type="button" className="pa-starter" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {messages.map((m, i) =>
              m.content ? <Bubble key={i} role={m.role} content={m.content} /> : null,
            )}
            {waiting || (busy && !messages[messages.length - 1]?.content) ? (
              <div className="pa-typing" aria-label="Writing a reply">
                <i />
                <i />
                <i />
              </div>
            ) : null}
            {lead ? (
              <p className="pa-lead" role="status">
                <Check className="h-4 w-4 shrink-0" strokeWidth={2.6} />
                Your request is with the team. Expect a reply within one working day.
              </p>
            ) : null}
            {error ? (
              <p className="pa-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <form
            className="pa-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <label htmlFor={`${titleId}-input`} className="sr-only">
              Your question
            </label>
            <textarea
              id={`${titleId}-input`}
              ref={field}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1500))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder="Ask about a service, a deadline, a notice…"
              className="pa-input"
            />
            <button
              type="submit"
              className="pa-send"
              disabled={busy || !input.trim()}
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </form>
          <p className="pa-foot">
            General information from our website, not advice on your situation.{' '}
            {botNumber ? (
              <a
                href={`https://wa.me/${botNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hello')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="inline h-3 w-3" strokeWidth={2.4} /> Continue on WhatsApp
              </a>
            ) : (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="inline h-3 w-3" strokeWidth={2.4} /> WhatsApp a person
              </a>
            )}
          </p>
        </section>
      ) : null}
    </>
  );
}

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M2.5 11.2 21 3.5l-6.6 17-3.6-6.6z" fill="currentColor" fillOpacity="0.18" />
      <path
        d="M2.5 11.2 21 3.5l-6.6 17-3.6-6.6zM10.8 13.9 21 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Bubble({ role, content }: Msg) {
  return (
    <div className={cn('pa-msg', role === 'user' ? 'pa-msg-user' : 'pa-msg-bot')}>
      {role === 'user' ? content : <Rich text={content} />}
    </div>
  );
}

/* --------------------------------------------------------------------------
   A minimal, safe markdown subset: paragraphs, "- " lists, **bold**, links.
   -------------------------------------------------------------------------- */

const SAFE_HREF =
  /^(\/(?!\/)[\w\-/#?=&.%]*|https:\/\/wa\.me\/\d+[^\s]*|mailto:[^\s]+|tel:\+?[\d\s-]+|https:\/\/(www\.)?thepaperplane\.co\.in\/[^\s]*)$/;

function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(<strong key={`${key}-b${i++}`}>{m[1]}</strong>);
    } else if (m[2] && m[3]) {
      const href = m[3];
      if (!SAFE_HREF.test(href)) out.push(m[2]);
      else if (href.startsWith('/'))
        out.push(
          <Link key={`${key}-l${i++}`} href={href}>
            {m[2]}
          </Link>,
        );
      else
        out.push(
          <a key={`${key}-l${i++}`} href={href} target="_blank" rel="noopener noreferrer">
            {m[2]}
          </a>,
        );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Rich({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.replace(/\r/g, '').split('\n');
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    const items = list;
    list = [];
    blocks.push(
      <ul key={`u${blocks.length}`}>
        {items.map((it, i) => (
          <li key={i}>{inline(it, `u${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
  };
  lines.forEach((raw) => {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]!);
      return;
    }
    flush();
    if (line)
      blocks.push(
        <p key={`p${blocks.length}`}>{inline(line.replace(/^#+\s*/, ''), `p${blocks.length}`)}</p>,
      );
  });
  flush();
  return <>{blocks}</>;
}
