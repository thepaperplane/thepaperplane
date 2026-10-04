import 'server-only';
import { getSettings } from './settings';
import { serviceClient } from './supabase';
import { busyBetween, createEvent, googleReady } from './integrations/google';

/**
 * Meeting slots and bookings, in India Standard Time.
 *
 * Slots are the working hours set in the console, cut into equal pieces,
 * minus anything already on the owner's Google Calendar (with a buffer either
 * side) and minus meetings already booked here. A booking re-checks its slot
 * against the calendar at the moment it is made, so two people choosing the
 * same time cannot both get it.
 */

const IST = 5.5 * 3600_000;

export type Slot = { start: string; end: string; label: string; day: string; time: string };

const dayFmt = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
});
const timeFmt = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

export function slotLabel(d: Date): string {
  return `${dayFmt.format(d)}, ${timeFmt.format(d)}`;
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export async function schedulingReady(): Promise<boolean> {
  const s = await getSettings();
  return s.scheduling.enabled && (await googleReady());
}

export async function availableSlots(limit = 40): Promise<Slot[]> {
  const { scheduling: cfg } = await getSettings();
  if (!cfg.enabled || !(await googleReady())) return [];

  const now = Date.now();
  const earliest = now + cfg.leadHours * 3600_000;
  const horizon = now + cfg.horizonDays * 86400_000;
  const busy = await busyBetween(new Date(now), new Date(horizon));

  const supabase = serviceClient();
  if (supabase) {
    const { data } = await supabase
      .from('meetings')
      .select('starts_at, ends_at')
      .eq('status', 'booked')
      .gte('ends_at', new Date(now).toISOString());
    (data ?? []).forEach((m) =>
      busy.push({ start: new Date(m.starts_at).getTime(), end: new Date(m.ends_at).getTime() }),
    );
  }

  const buffer = cfg.bufferMinutes * 60_000;
  const length = cfg.slotMinutes * 60_000;
  const open = minutesOf(cfg.start);
  const close = minutesOf(cfg.end);
  const out: Slot[] = [];

  // Midnight IST today, as a UTC instant.
  const istNow = new Date(now + IST);
  const dayZero =
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - IST;

  for (let d = 0; d <= cfg.horizonDays && out.length < limit; d++) {
    const midnight = dayZero + d * 86400_000;
    const weekday = new Date(midnight + IST).getUTCDay();
    if (!cfg.days.includes(weekday)) continue;
    for (let m = open; m + cfg.slotMinutes <= close && out.length < limit; m += cfg.slotMinutes) {
      const start = midnight + m * 60_000;
      const end = start + length;
      if (start < earliest || end > horizon) continue;
      const clash = busy.some((b) => start < b.end + buffer && end > b.start - buffer);
      if (clash) continue;
      const s = new Date(start);
      out.push({
        start: s.toISOString(),
        end: new Date(end).toISOString(),
        label: slotLabel(s),
        day: dayFmt.format(s),
        time: timeFmt.format(s),
      });
    }
  }
  return out;
}

export type Booking = {
  start: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  waId?: string | null;
  topic: string;
  source: 'website' | 'whatsapp' | 'console';
  enquiryId?: string | null;
  clientId?: string | null;
};

export type Booked = { id: string; label: string; meetLink: string | null };

export async function bookMeeting(b: Booking): Promise<Booked> {
  const { scheduling: cfg } = await getSettings();
  const start = new Date(b.start);
  if (Number.isNaN(start.getTime())) throw new Error('That time could not be read.');
  // Only times we actually offer can be booked.
  const offered = await availableSlots(200);
  const slot = offered.find((s) => new Date(s.start).getTime() === start.getTime());
  if (!slot) throw new Error('That time is no longer available. Please pick another.');
  const end = new Date(slot.end);

  const event = await createEvent({
    start,
    end,
    summary: `${cfg.title} · ${b.name}`,
    description: [
      `Topic: ${b.topic}`,
      b.phone ? `Phone: ${b.phone}` : '',
      b.email ? `Email: ${b.email}` : '',
      `Booked via the ${b.source === 'whatsapp' ? 'WhatsApp assistant' : b.source === 'website' ? 'website' : 'console'}.`,
    ]
      .filter(Boolean)
      .join('\n'),
    attendeeEmail: b.email,
  });

  const supabase = serviceClient();
  let id = event.id;
  if (supabase) {
    const { data } = await supabase
      .from('meetings')
      .insert({
        source: b.source,
        name: b.name,
        email: b.email ?? null,
        phone: b.phone ?? null,
        wa_id: b.waId ?? null,
        topic: b.topic.slice(0, 1000),
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        google_event_id: event.id,
        meet_link: event.meetLink,
        status: 'booked',
        enquiry_id: b.enquiryId ?? null,
        client_id: b.clientId ?? null,
      })
      .select('id')
      .single();
    if (data) id = data.id;
  }
  return { id, label: slot.label, meetLink: event.meetLink };
}
