import type { Metadata } from 'next';
import { Clock, Mail } from 'lucide-react';
import { Card, Container, Eyebrow, Section, SectionHeading } from '@/components/ui';
import { CalendarView } from '@/components/calendar/calendar-view';
import { SubscribeForm } from '@/components/calendar/subscribe-form';
import { TURNAROUNDS } from '@/content/calendar';
import { pageOg } from '@/lib/site';
import { loadContent, pick } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Compliance Calendar',
  description:
    'Every statutory due date for Indian tax, GST, payroll and MCA compliance, month by month, with the penalty for missing each one. Monthly reminders by email.',
  alternates: { canonical: '/calendar' },
  openGraph: pageOg({
    title: 'Compliance Calendar',
    description:
      'Statutory due dates for tax, GST, payroll, audit and MCA — with a free monthly email reminder.',
    path: '/calendar',
  }),
};

// The default month follows the server's clock in IST.
function currentMonthIST(): number {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    month: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  return Number(formatter.format(new Date()));
}

export default async function CalendarPage() {
  const month = currentMonthIST();
  const copy = await loadContent('calendar');

  return (
    <>
      {/* Header */}
      <Section className="pt-[calc(4.5rem+var(--space-section-sm))] pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10" />
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Compliance Calendar"
            title={pick(copy, 'calendar.hero.title')}
            lede={pick(copy, 'calendar.hero.lede')}
          />
        </Container>
      </Section>

      {/* Calendar */}
      <Section className="pt-0 pb-16 sm:pb-20">
        <Container>
          <CalendarView initialMonth={month} />
        </Container>
      </Section>

      {/* Subscribe */}
      <Section tone="sunken" id="subscribe" className="scroll-mt-24 py-16 sm:py-20">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <Eyebrow className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" strokeWidth={2.2} />
                Monthly reminder
              </Eyebrow>
              <h2 className="text-ink mt-4 text-[length:var(--text-display-2)] leading-[1.1] font-semibold tracking-[-0.03em]">
                {pick(copy, 'calendar.subscribe.title')}
              </h2>
              <p className="text-ink-3 mt-5 text-lg leading-relaxed">
                {pick(copy, 'calendar.subscribe.lede')}
              </p>

              <ul className="mt-7 space-y-3">
                {[
                  'Sent once a month — never a drip sequence',
                  'Segmented so you only get dates that apply to you',
                  'Extensions and notifications flagged when they are announced',
                  'One-click unsubscribe in every email',
                ].map((item) => (
                  <li key={item} className="text-ink-2 flex items-start gap-2.5 text-[0.9375rem]">
                    <span className="bg-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Card className="bg-surface p-7 sm:p-9">
              <SubscribeForm />
            </Card>
          </div>
        </Container>
      </Section>

      {/* Turnarounds */}
      <Section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Statutory clocks"
            title="How long each process actually takes"
            lede="Deadlines are only half the picture. These are the windows the department works to — and the ones you are held to."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TURNAROUNDS.map((item) => (
              <Card key={item.section} className="bg-surface flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-ink-3 font-[family-name:var(--font-mono)] text-[0.75rem]">
                    {item.section}
                  </span>
                  <Clock className="text-accent h-4 w-4 shrink-0" strokeWidth={2} />
                </div>

                <h3 className="text-ink mt-3 text-[1.0625rem] leading-snug font-semibold">
                  {item.service}
                </h3>
                <p className="text-accent mt-1.5 text-[0.9375rem] font-semibold">{item.duration}</p>
                <p className="text-ink-3 mt-3 flex-1 text-[0.875rem] leading-relaxed">
                  {item.detail}
                </p>
              </Card>
            ))}
          </div>

          <p className="text-ink-3 mt-6 max-w-3xl text-[0.8125rem] leading-relaxed">
            Dates shown reflect the standard statutory position. The CBDT, GSTN and MCA extend
            deadlines from time to time by notification; subscribers are told when that happens.
            Confirm your own position with us before relying on any date here.
          </p>
        </Container>
      </Section>
    </>
  );
}
