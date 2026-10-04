import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { after } from 'next/server';
import { z } from 'zod';
import { apiError, clientIp, rateLimit, readJson } from '@/lib/api';
import { getSettings } from '@/lib/settings';
import { serviceClient } from '@/lib/supabase';
import { sendEnquiryNotification } from '@/lib/email';
import { liveSystem, stableSystem, TOOLS } from '@/lib/assistant/prompt';
import { anthropic as claude, modelFor, shapeFor } from '@/lib/ai/claude';
import type { Tier } from '@/lib/ai/claude';
import { autoPushLead } from '@/lib/integrations/zoho';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * The site assistant.
 *
 * One visitor message in, a streamed reply out, as newline-delimited JSON:
 *   {"t":"meta","id":"<conversation>"}   first, always
 *   {"t":"d","v":"text"}                  reply text, as it is written
 *   {"t":"lead"}                          the visitor's request was recorded
 *   {"t":"done"} | {"t":"error","message":"..."}
 *
 * History comes from the database, never from the browser: a client could
 * otherwise put words in the assistant's mouth by sending a doctored
 * transcript. Only the newest message is taken from the request.
 */

const HISTORY = 12;
const PER_IP_PER_DAY = 60;

const Body = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(1500),
  page: z
    .string()
    .max(200)
    .regex(/^\/[\w\-/#?=&.%]*$/)
    .optional(),
  /** Only honoured when there is no database to read history from. */
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }))
    .max(HISTORY)
    .optional(),
});

const EnquiryInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320).optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+\d][\d\s-]{6,}$/)
    .optional()
    .or(z.literal('')),
  need: z.string().trim().min(5).max(2000),
  service: z.string().trim().max(80).optional(),
});

const hashIp = (ip: string) =>
  createHash('sha256')
    .update(`${process.env.ASSISTANT_SALT ?? 'pp-assistant'}:${ip}`)
    .digest('hex')
    .slice(0, 32);

function todayIST(): { label: string; startUtc: string } {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600_000);
  const start = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  return {
    label: ist.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    startUtc: new Date(start.getTime() - 5.5 * 3600_000).toISOString(),
  };
}

export async function POST(request: Request) {
  const settings = await getSettings();
  if (!settings.assistant.enabled || !process.env.ANTHROPIC_API_KEY) {
    return apiError('The assistant is not available right now.', 503);
  }

  const ip = clientIp(request);
  const burst = rateLimit(`assistant:${ip}`, { limit: 10, windowMs: 120_000 });
  if (!burst.ok) {
    return apiError('You are sending messages quickly — give it a moment and try again.', 429, {
      retryAfter: burst.retryAfter,
    });
  }

  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success) return apiError('That message could not be read.');
  const { message, page } = parsed.data;

  const db = serviceClient();
  const ipHash = hashIp(ip);
  const day = todayIST();

  // Daily limits: per visitor, and for the whole site (cost guard).
  if (db) {
    const [{ count: siteCount }, { data: mine }] = await Promise.all([
      db
        .from('assistant_messages')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', day.startUtc),
      db
        .from('assistant_conversations')
        .select('message_count')
        .eq('ip_hash', ipHash)
        .gte('last_at', day.startUtc),
    ]);
    if ((siteCount ?? 0) >= settings.assistant.dailyCap) {
      return apiError(
        'The assistant has answered all it can for today. Please message us on WhatsApp or use the contact form — a person will reply.',
        429,
      );
    }
    const used = (mine ?? []).reduce((n, r) => n + Math.ceil(r.message_count / 2), 0);
    if (used >= PER_IP_PER_DAY) {
      return apiError(
        'That is as many questions as the assistant can take from one visitor today. The team will happily continue on WhatsApp or by email.',
        429,
      );
    }
  }

  // Conversation and its history.
  let conversationId = parsed.data.conversationId;
  let history: Anthropic.Beta.BetaMessageParam[] = [];
  if (db) {
    if (conversationId) {
      const { data: conv } = await db
        .from('assistant_conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();
      if (!conv) conversationId = undefined;
    }
    if (conversationId) {
      const { data: rows } = await db
        .from('assistant_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('id', { ascending: false })
        .limit(HISTORY);
      history = (rows ?? []).reverse().map((r) => ({ role: r.role, content: r.content }));
    } else {
      const { data: conv } = await db
        .from('assistant_conversations')
        .insert({
          ip_hash: ipHash,
          user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
          first_page: page ?? null,
        })
        .select('id')
        .single();
      conversationId = conv?.id;
    }
    if (conversationId) {
      await db
        .from('assistant_messages')
        .insert({ conversation_id: conversationId, role: 'user', content: message });
    }
  } else if (parsed.data.history) {
    history = parsed.data.history.map((m) => ({ role: m.role, content: m.content }));
  }
  // The API wants the conversation to open with the visitor.
  while (history.length && history[0]!.role !== 'user') history.shift();

  const [{ data: jobs }, { data: knowledge }] = db
    ? await Promise.all([
        db.from('jobs').select('title, location, employment_type').eq('is_open', true).limit(12),
        db
          .from('assistant_knowledge')
          .select('title, body')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(60),
      ])
    : [{ data: [] }, { data: [] }];

  const system = [
    stableSystem(),
    liveSystem({
      today: day.label,
      contact: settings.contact,
      jobs: (jobs ?? []).map((j) => ({
        title: j.title,
        location: j.location ?? null,
        type: j.employment_type ?? null,
      })),
      notes: settings.assistant.notes,
      knowledge: knowledge ?? [],
      page,
    }),
  ];

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history,
    { role: 'user', content: message },
  ];

  const anthropic = claude();
  const MODEL = modelFor(settings.assistant.tier as Tier);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      send({ t: 'meta', id: conversationId ?? null });

      let reply = '';
      let usage = { input: 0, output: 0, cached: 0 };
      let leadId: string | null = null;

      try {
        // At most two rounds: an answer, or a tool call and then the answer.
        for (let round = 0; round < 2; round++) {
          const turn = anthropic.beta.messages.stream({
            model: MODEL,
            max_tokens: 2048,
            ...shapeFor(MODEL, 'low'),
            system,
            tools: TOOLS,
            messages,
          });
          turn.on('text', (delta) => {
            reply += delta;
            send({ t: 'd', v: delta });
          });
          const final = await turn.finalMessage();
          usage = {
            input: usage.input + (final.usage.input_tokens ?? 0),
            output: usage.output + (final.usage.output_tokens ?? 0),
            cached: usage.cached + (final.usage.cache_read_input_tokens ?? 0),
          };

          if (final.stop_reason === 'refusal') {
            const note =
              'I can’t help with that here. For anything about your own situation, the team will look at it directly — [contact us](/contact).';
            reply += note;
            send({ t: 'd', v: note });
            break;
          }
          if (final.stop_reason !== 'tool_use') break;

          const calls = final.content.filter(
            (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use',
          );
          const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
          for (const call of calls) {
            if (call.name !== 'record_enquiry') {
              results.push({
                type: 'tool_result',
                tool_use_id: call.id,
                is_error: true,
                content: 'Unknown tool.',
              });
              continue;
            }
            const input = EnquiryInput.safeParse(call.input);
            if (!input.success || (!input.data.email && !input.data.phone)) {
              results.push({
                type: 'tool_result',
                tool_use_id: call.id,
                is_error: true,
                content:
                  'Not recorded: a name, a valid email or phone number, and a short description are all needed. Ask the visitor for what is missing.',
              });
              continue;
            }
            leadId = await recordLead(db, input.data, conversationId, page);
            results.push({
              type: 'tool_result',
              tool_use_id: call.id,
              content:
                leadId || !db
                  ? 'Recorded. The team replies within one working day.'
                  : 'Could not be recorded just now. Give the visitor the WhatsApp link and email address instead.',
            });
            if (leadId || !db) send({ t: 'lead' });
          }
          messages.push({ role: 'assistant', content: final.content });
          messages.push({ role: 'user', content: results });
        }
        send({ t: 'done' });
      } catch (error) {
        const msg =
          error instanceof Anthropic.RateLimitError ||
          error instanceof Anthropic.InternalServerError
            ? 'The assistant is busy right now. Please try again in a minute, or message us on WhatsApp.'
            : 'Something went wrong on our side. Please try again, or use the contact form.';
        if (error instanceof Anthropic.APIError) {
          console.error('[assistant] api error', error.status, error.message);
        } else {
          console.error('[assistant] failed', error);
        }
        send({ t: 'error', message: msg });
      } finally {
        if (db && conversationId && reply.trim()) {
          await db.from('assistant_messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: reply.slice(0, 8000),
            model: MODEL,
            input_tokens: usage.input,
            output_tokens: usage.output,
            cached_tokens: usage.cached,
          });
          const { data: conv } = await db
            .from('assistant_conversations')
            .select('message_count')
            .eq('id', conversationId)
            .maybeSingle();
          await db
            .from('assistant_conversations')
            .update({
              last_at: new Date().toISOString(),
              message_count: (conv?.message_count ?? 0) + 2,
              ...(leadId ? { enquiry_id: leadId } : {}),
            })
            .eq('id', conversationId);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function recordLead(
  db: ReturnType<typeof serviceClient>,
  lead: z.infer<typeof EnquiryInput>,
  conversationId: string | undefined,
  page: string | undefined,
): Promise<string | null> {
  const message = `${lead.need}\n\n— Sent through the website assistant${
    conversationId ? ` (conversation ${conversationId})` : ''
  }.`;
  if (!db) {
    await sendEnquiryNotification({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || undefined,
      serviceId: lead.service,
      message,
    }).catch(() => undefined);
    return null;
  }
  const { data, error } = await db
    .from('enquiries')
    .insert({
      name: lead.name,
      email: lead.email || `no-email+${Date.now()}@assistant.invalid`,
      phone: lead.phone || null,
      service_id: lead.service || null,
      message,
      state: 'new',
      referrer: page ?? null,
      user_agent: 'site-assistant',
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('[assistant] lead insert failed', error);
    return null;
  }
  const enquiryId = data.id;
  try {
    after(() => autoPushLead(enquiryId));
  } catch {
    await autoPushLead(enquiryId);
  }
  await db
    .from('enquiry_meta')
    .insert({
      enquiry_id: data.id,
      utm_source: 'assistant',
      utm_medium: 'chat',
      landing_path: page ?? null,
    })
    .then(
      () => undefined,
      () => undefined,
    );
  await sendEnquiryNotification({
    name: lead.name,
    email: lead.email || '(not given)',
    phone: lead.phone || undefined,
    serviceId: lead.service,
    message,
  }).catch(() => undefined);
  return data.id;
}
