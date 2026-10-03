import 'server-only';
import { SITE } from '@/lib/site';
import { PRACTICE } from '@/content/practice';
import { PILLARS } from '@/content/services';
import { SERVICE_FLOWS } from '@/content/service-flows';
import {
  ARTICLES,
  DECODER,
  MYTHS,
  PENALTY_EXPOSURE,
  SERVICE_ANATOMY,
  TIMELINE_POSITION,
} from '@/content/knowledge';
import { COMPLIANCE_EVENTS, MONTHS, TURNAROUNDS } from '@/content/calendar';

/**
 * The assistant's reference: the website, as text.
 *
 * Built from the same content modules the pages render, so anything published
 * on the site is something the assistant knows and nothing else is. The
 * output is deterministic — same content, same bytes — which is what lets the
 * API cache it between visitors (see lib/assistant/prompt.ts).
 */

const line = (s: string) => s.replace(/\s+/g, ' ').trim();

function practice(): string {
  const out = ['## The practice'];
  out.push(
    `${SITE.name} — "${SITE.tagline}". ${line(SITE.description)} ${SITE.serviceModel}. Founded ${SITE.foundedYear}. No public office address; all work is done remotely through secure online channels.`,
  );
  for (const side of PRACTICE) {
    out.push(`### ${side.heading} (${side.name}) — ${side.statement}`);
    out.push(line(side.body));
    for (const cap of side.capabilities) out.push(`- ${cap.title}: ${line(cap.detail)}`);
  }
  out.push(
    '### How every engagement runs',
    '1. First read — someone reads the actual document (notice, contract, brief) in full before any fee is quoted. No charge, no obligation.',
    '2. Scope — what is included, what is not, the fee and what is needed from the client by when, agreed in writing. If it grows, the client hears first, not in the invoice.',
    '3. Groundwork — reconciliation, ledger repair, evidence, or discovery on a build: the unseen majority of the work.',
    '4. Review — preparation and review are separate passes by separate people, from the underlying records.',
    '5. Takeoff & aftercare — the site goes live or the return is filed, and questions on delivered work are answered as part of the engagement.',
  );
  return out.join('\n');
}

function services(): string {
  const out = ['## Services (all listed on /services)'];
  for (const pillar of PILLARS) {
    out.push(`### ${pillar.title} — ${pillar.tagline}`);
    out.push(line(pillar.description));
    for (const s of pillar.services) {
      const flow = SERVICE_FLOWS[s.id];
      out.push(`#### ${s.title} (${s.subtitle}) — page: /services#${s.id}`);
      out.push(line(s.description));
      out.push(`Includes: ${s.features.join('; ')}.`);
      if (flow) {
        out.push(
          `Client provides: ${flow.give}. We do: ${flow.work}. Client receives: ${flow.get}.`,
        );
      }
    }
  }
  return out.join('\n');
}

function anatomy(): string {
  const out = ['## What the work involves (Knowledge Corner, /knowledge#anatomy)'];
  for (const a of SERVICE_ANATOMY) {
    out.push(`### ${a.service}`);
    out.push(`Common perception: ${line(a.perception)} Reality: ${line(a.reality)}`);
    out.push(`Needed from the client: ${line(a.clientInput)}`);
    out.push(`Scope: ${line(a.workScope)}`);
    out.push(`Timeline depends on: ${a.timelineDrivers.join('; ')}.`);
    a.steps.forEach((st, i) =>
      out.push(
        `${i + 1}. ${st.label} (${st.share}% of effort) — ${line(st.detail)} If skipped: ${line(st.risk)}`,
      ),
    );
  }
  out.push(
    `### ${TIMELINE_POSITION.heading}`,
    line(TIMELINE_POSITION.body),
    line(TIMELINE_POSITION.note),
  );
  return out.join('\n');
}

function notices(): string {
  const out = ['## Notice decoder (/knowledge#decoder) — what common notices mean'];
  for (const d of DECODER) {
    out.push(
      `- ${d.title} (${d.act}): ${line(d.plainEnglish)} What to do: ${line(d.whatToDo)} Clock: ${line(d.clock)}`,
    );
  }
  out.push('## Cost of non-compliance (/knowledge#exposure)');
  for (const p of PENALTY_EXPOSURE) {
    out.push(`- ${p.trigger} (${p.statute}): ${p.exposure}. ${line(p.compounding)}`);
  }
  out.push('## Common myths');
  for (const m of MYTHS) out.push(`- Myth: ${line(m.myth)} Reality: ${line(m.reality)}`);
  return out.join('\n');
}

function calendar(): string {
  const out = ['## Compliance calendar (/calendar) — statutory due dates'];
  for (const e of COMPLIANCE_EVENTS) {
    const month = MONTHS[(e.month ?? 1) - 1] ?? '';
    const when =
      e.cadence === 'monthly'
        ? `day ${e.day} of every month`
        : `${e.day} ${month}${e.cadence === 'quarterly' ? ' (quarterly)' : ''}`;
    out.push(
      `- ${e.title} — ${when}. ${line(e.description)} (${e.statute}; applies to: ${e.appliesTo})${
        e.penalty ? ` Late: ${line(e.penalty)}` : ''
      }`,
    );
  }
  out.push('### Statutory processing windows');
  for (const t of TURNAROUNDS)
    out.push(`- ${t.section} — ${t.service}: ${t.duration}. ${line(t.detail)}`);
  out.push(
    'Dates reflect the standard statutory position; CBDT, GSTN and MCA extend them by notification from time to time. Visitors should confirm their own position with the practice before relying on a date.',
  );
  return out.join('\n');
}

function articles(): string {
  const out = ['## Articles (/knowledge/<slug>)'];
  for (const a of ARTICLES) {
    out.push(`### ${a.title} — /knowledge/${a.slug} (${a.category}, ${a.date})`);
    out.push(line(a.summary));
    for (const b of a.body) {
      if (b.heading) out.push(`**${b.heading}**`);
      for (const para of b.paragraphs) out.push(line(para));
    }
  }
  return out.join('\n');
}

function pages(): string {
  return [
    '## Pages on the site',
    '- / — home; /services — every service; /work — websites built for clients; /knowledge — Knowledge Corner (walkthroughs, notice decoder, articles); /calendar — compliance calendar with a monthly reminder email and an .ics download; /about — vision, mission and how the practice works; /careers — open roles; /contact — enquiry form; /news — tax and compliance news feed; /privacy, /terms, /cookies, /security — policies.',
  ].join('\n');
}

let cached: string | null = null;

/** The whole reference, built once per server instance. */
export function siteKnowledge(): string {
  if (!cached) {
    cached = [practice(), services(), anatomy(), notices(), calendar(), articles(), pages()].join(
      '\n\n',
    );
  }
  return cached;
}
