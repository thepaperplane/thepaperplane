import type { Metadata } from 'next';
import { Clock, Globe, Mail, MessageCircle, Phone } from 'lucide-react';
import { Card, Container, Eyebrow, Section, SectionHeading } from '@/components/ui';
import { ContactForm } from '@/components/contact/contact-form';
import { pageOg } from '@/lib/site';
import { getSettings, whatsappHref } from '@/lib/settings';
import { loadContent, pick } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Talk to The Paper Plane about tax filing, a scrutiny notice, incorporation, audit or a software build. We reply within one working day.',
  alternates: { canonical: '/contact' },
  openGraph: pageOg({
    title: 'Contact',
    description: 'Start a conversation about compliance, defence or digital infrastructure.',
    path: '/contact',
  }),
};

/**
 * NOTE: no address block and no embedded map, by design — the practice is
 * remote-first. Contact channels only.
 */
export default async function ContactPage() {
  const [copy, settings] = await Promise.all([loadContent('contact'), getSettings()]);
  const contact = settings.contact;

  return (
    <>
      <Section className="pt-[calc(4.5rem+var(--space-section-sm))] pb-14">
        <div className="pointer-events-none absolute inset-0 -z-10" />
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Contact"
            title={pick(copy, 'contact.hero.title')}
            lede={pick(copy, 'contact.hero.lede')}
          />
        </Container>
      </Section>

      <Section className="pt-0 pb-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
            <Card className="bg-surface p-7 sm:p-9">
              <ContactForm />
            </Card>

            <div className="space-y-5">
              <Card className="bg-surface p-7">
                <Eyebrow>Direct channels</Eyebrow>

                <ul className="mt-5 space-y-4">
                  <li>
                    <a href={`tel:${contact.phoneIntl}`} className="group flex items-start gap-3.5">
                      <span className="bg-accent-wash ring-accent/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ring-1 ring-inset">
                        <Phone className="text-accent h-4 w-4" strokeWidth={2} />
                      </span>
                      <span>
                        <span className="text-ink-3 block text-[0.75rem] font-medium">Phone</span>
                        <span className="text-ink group-hover:text-accent block text-[0.9375rem] font-semibold transition-colors">
                          {contact.phone}
                        </span>
                      </span>
                    </a>
                  </li>

                  <li>
                    <a href={`mailto:${contact.email}`} className="group flex items-start gap-3.5">
                      <span className="bg-accent-wash ring-accent/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ring-1 ring-inset">
                        <Mail className="text-accent h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0">
                        <span className="text-ink-3 block text-[0.75rem] font-medium">Email</span>
                        <span className="text-ink group-hover:text-accent block truncate text-[0.9375rem] font-semibold transition-colors">
                          {contact.email}
                        </span>
                      </span>
                    </a>
                  </li>

                  <li>
                    <a
                      href={whatsappHref(contact.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3.5"
                    >
                      <span className="bg-positive/10 ring-positive/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ring-1 ring-inset">
                        <MessageCircle className="text-positive h-4 w-4" strokeWidth={2} />
                      </span>
                      <span>
                        <span className="text-ink-3 block text-[0.75rem] font-medium">
                          WhatsApp
                        </span>
                        <span className="text-ink group-hover:text-positive block text-[0.9375rem] font-semibold transition-colors">
                          Message us directly
                        </span>
                      </span>
                    </a>
                  </li>
                </ul>
              </Card>

              <Card className="bg-surface p-7">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3.5">
                    <Clock className="text-ink-3 mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                    <span>
                      <span className="text-ink-3 block text-[0.75rem] font-medium">
                        Working hours
                      </span>
                      <span className="text-ink block text-[0.9375rem]">{contact.hours}</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3.5">
                    <Globe className="text-ink-3 mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                    <span>
                      <span className="text-ink-3 block text-[0.75rem] font-medium">
                        How we work
                      </span>
                      <span className="text-ink block text-[0.9375rem]">
                        {'Remote-first practice serving clients across India'}
                      </span>
                    </span>
                  </li>
                </ul>
              </Card>

              <Card className="bg-sunken p-7">
                <h2 className="text-ink text-[1rem] font-semibold">Holding a notice?</h2>
                <p className="text-ink-3 mt-2 text-[0.875rem] leading-relaxed">
                  Statutory reply windows are short and rarely extended. If you have received
                  something under section 142(1), 143(2) or 148, tell us the date on the notice
                  first — that determines everything else.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
