import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, FileText, Video } from 'lucide-react';
import { Card, Container, Section, SectionHeading } from '@/components/ui';
import { SlotPicker } from '@/components/book/slot-picker';
import { getSettings, whatsappHref } from '@/lib/settings';
import { pageOg } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Book a call',
  description:
    'Book a free consultation with The Paper Plane on Google Meet — pick a time that is genuinely free on our calendar and get the invitation by email.',
  alternates: { canonical: '/book' },
  openGraph: pageOg({
    title: 'Book a call',
    description: 'A free first conversation about your notice, filing, website or brief.',
    path: '/book',
  }),
};

export const revalidate = 3600;

export default async function BookPage() {
  const { contact } = await getSettings();
  return (
    <Section className="pt-[calc(4.5rem+var(--space-section-sm))] pb-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16 lg:gap-y-10">
          <div>
            <SectionHeading
              as="h1"
              eyebrow="Book a call"
              title="A free first conversation"
              lede="Thirty minutes on Google Meet with someone who will actually read your document. No charge, and no obligation after it."
            />
            <ul className="mt-10 grid gap-5">
              {[
                {
                  icon: Video,
                  t: 'On Google Meet',
                  d: 'The link comes with the calendar invitation.',
                },
                {
                  icon: Clock,
                  t: 'Times are live',
                  d: 'Everything shown is free on our calendar right now, in India time.',
                },
                {
                  icon: FileText,
                  t: 'Bring the paper',
                  d: 'The notice, the brief or the question — that is what decides the advice.',
                },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-4">
                  <span className="bg-accent-wash text-accent grid h-10 w-10 shrink-0 place-items-center rounded-full">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="text-ink block text-[0.9375rem] font-semibold">{t}</span>
                    <span className="text-ink-2 mt-0.5 block text-[0.875rem] leading-relaxed">
                      {d}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="bg-surface self-start p-6 sm:p-8 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <SlotPicker whatsappHref={whatsappHref(contact.whatsapp)} />
          </Card>
          <div className="text-ink-2 grid gap-4 border-t border-[var(--hairline)] pt-8 text-[0.9375rem] leading-relaxed lg:col-start-1 lg:row-start-2">
            <h2 className="text-ink text-[1rem] font-semibold">What the call is for</h2>
            <p>
              Most calls are about one of three things: a tax or GST notice with a reply date on it,
              a return or registration that needs doing properly, or a website, brand or automation
              for the business. Tell us which in a line when you book, and the person on the call
              will have read it first.
            </p>
            <p>
              By the end you will know what the issue actually is, what needs to happen and by when,
              and what it would cost for us to handle it — in writing, if you ask. If we are not the
              right people for it, we will say so on the call.
            </p>
            <p>
              Not sure which service fits? See{' '}
              <Link href="/services" className="text-accent font-semibold hover:underline">
                everything we do
              </Link>
              , check the{' '}
              <Link href="/calendar" className="text-accent font-semibold hover:underline">
                compliance calendar
              </Link>{' '}
              for your next due date, or{' '}
              <Link href="/contact" className="text-accent font-semibold hover:underline">
                write to us instead
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
