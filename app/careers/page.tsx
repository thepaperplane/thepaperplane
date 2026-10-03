import type { Metadata } from 'next';
import { Briefcase, Clock, Compass, Globe2, Layers, MapPin, ShieldCheck } from 'lucide-react';
import { Container, Section, SectionHeading } from '@/components/ui';
import { CtaLink, Tilt } from '@/components/fx';
import { Editable } from '@/components/editable';
import { ApplyForm } from '@/components/careers/apply-form';
import { FlightRule } from '@/components/site/flight-rule';
import { loadOpenJobs } from '@/lib/public-data';
import { SITE, pageOg } from '@/lib/site';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Work with The Paper Plane — a remote-first team across India building websites and software and handling tax compliance. See open roles and apply.',
  alternates: { canonical: '/careers' },
  openGraph: pageOg({
    title: 'Careers',
    description: 'Open roles at The Paper Plane, and how to apply.',
    path: '/careers',
  }),
};

export const revalidate = 3600;

const VALUES = [
  {
    id: 'remote',
    icon: Globe2,
    title: 'Remote-first, across India',
    body: 'Work from wherever you do your best work. What matters is the file, not the chair.',
  },
  {
    id: 'both',
    icon: Layers,
    title: 'Both sides of the business',
    body: 'Developers learn how a GST return is built; tax associates see how the software works. Few places teach both.',
  },
  {
    id: 'review',
    icon: ShieldCheck,
    title: 'Nothing ships on one pair of eyes',
    body: 'Every piece of work is reviewed by someone else. You will learn faster here than anywhere you are left alone.',
  },
  {
    id: 'ownership',
    icon: Compass,
    title: 'Small team, real ownership',
    body: 'You will own outcomes for real clients from your first month, with someone senior beside you.',
  },
];

export default async function CareersPage() {
  const jobs = await loadOpenJobs();

  const postings = jobs.map((job) => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: [job.summary, job.description, ...job.responsibilities, ...job.requirements]
      .filter(Boolean)
      .join('\n'),
    datePosted: job.created_at.slice(0, 10),
    ...(job.closes_on ? { validThrough: job.closes_on } : {}),
    employmentType: job.employment_type.toUpperCase().replace(/[^A-Z]+/g, '_'),
    hiringOrganization: { '@type': 'Organization', name: SITE.name, sameAs: SITE.url },
    jobLocationType: /remote/i.test(job.location) ? 'TELECOMMUTE' : undefined,
    applicantLocationRequirements: { '@type': 'Country', name: 'India' },
    ...(/remote/i.test(job.location)
      ? {}
      : {
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: job.location,
              addressCountry: 'IN',
            },
          },
        }),
    directApply: true,
    url: `${SITE.url}/careers#role-${job.slug}`,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([{ name: 'Careers', path: '/careers' }]),
            ...postings,
          ),
        }}
      />

      <Section className="pt-[calc(4.5rem+var(--space-section-sm))] pb-12">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Careers"
            title="Help businesses take off. Build a career that does too."
            lede="We are a small, remote-first team that builds websites and software and handles the tax and compliance underneath them. We hire people who like getting things exactly right."
          />
          <div className="reveal mt-9 flex flex-wrap items-center gap-3">
            <CtaLink href={jobs.length ? '#roles' : '#apply'} size="lg">
              {jobs.length
                ? `See ${jobs.length} open ${jobs.length === 1 ? 'role' : 'roles'}`
                : 'Introduce yourself'}
            </CtaLink>
          </div>
        </Container>
      </Section>

      <Container>
        <FlightRule className="py-2" />
      </Container>

      <Section rhythm="default">
        <Container>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <li key={v.id} className="reveal" data-reveal-delay={String(i * 90)}>
                  <Tilt className="bento h-full p-7" max={6}>
                    <span className="bg-accent text-accent-ink grid h-11 w-11 place-items-center rounded-2xl">
                      <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <h2 className="mt-5 text-[length:var(--text-title-3)]">
                      <Editable k={`careers.values.${v.id}.title`}>{v.title}</Editable>
                    </h2>
                    <Editable
                      k={`careers.values.${v.id}.body`}
                      as="p"
                      multiline
                      className="text-ink-2 mt-3 block text-[length:var(--text-small)] leading-relaxed"
                    >
                      {v.body}
                    </Editable>
                  </Tilt>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section id="roles" rhythm="default" tone="sunken" className="scroll-mt-24 border-y">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="label">Open roles</span>
              <h2 className="mt-3 text-[length:var(--text-display-2)] leading-[1.02]">
                {jobs.length ? 'Where we need you' : 'No open roles right now'}
              </h2>
            </div>
            {!jobs.length ? (
              <p className="text-ink-2 max-w-[44ch] text-[length:var(--text-body)] leading-relaxed">
                We still read every introduction. If you are good at what you do, tell us below and
                we will write back when something fits.
              </p>
            ) : null}
          </div>

          {jobs.length ? (
            <ul className="mt-12 space-y-4">
              {jobs.map((job) => (
                <li key={job.id} id={`role-${job.slug}`} className="reveal scroll-mt-28">
                  <details className="bento group p-6 sm:p-8 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-5">
                      <div className="min-w-0">
                        <h3 className="text-[length:var(--text-title-2)] leading-tight">
                          {job.title}
                        </h3>
                        <ul className="text-ink-3 mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[length:var(--text-caption)]">
                          {job.team ? (
                            <li className="inline-flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5" aria-hidden="true" /> {job.team}
                            </li>
                          ) : null}
                          <li className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {job.location}
                          </li>
                          <li className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />{' '}
                            {job.employment_type}
                          </li>
                          {job.experience ? <li>{job.experience}</li> : null}
                        </ul>
                      </div>
                      <span className="text-accent inline-flex h-11 items-center gap-2 text-[length:var(--text-small)] font-semibold">
                        <span className="group-open:hidden">View role</span>
                        <span className="hidden group-open:inline">Close</span>
                      </span>
                    </summary>
                    <div className="mt-6 grid gap-8 border-t pt-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                      <div>
                        {job.summary ? (
                          <p className="text-ink text-[length:var(--text-body-lg)] leading-relaxed">
                            {job.summary}
                          </p>
                        ) : null}
                        {job.description ? (
                          <p className="text-ink-2 mt-4 text-[length:var(--text-small)] leading-relaxed whitespace-pre-line">
                            {job.description}
                          </p>
                        ) : null}
                        {job.responsibilities.length ? (
                          <>
                            <h4 className="mt-6 text-[length:var(--text-small)]">
                              What you will do
                            </h4>
                            <ul className="text-ink-2 mt-3 list-disc space-y-1.5 pl-5 text-[length:var(--text-small)]">
                              {job.responsibilities.map((r) => (
                                <li key={r}>{r}</li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                      </div>
                      <div>
                        {job.requirements.length ? (
                          <>
                            <h4 className="text-[length:var(--text-small)]">What you bring</h4>
                            <ul className="text-ink-2 mt-3 list-disc space-y-1.5 pl-5 text-[length:var(--text-small)]">
                              {job.requirements.map((r) => (
                                <li key={r}>{r}</li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                        <div className="mt-7">
                          <CtaLink href={`#apply-${job.id}`}>Apply for this role</CtaLink>
                        </div>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
        </Container>
      </Section>

      <Section id="apply" rhythm="default" className="scroll-mt-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <div>
              <span className="label">Apply</span>
              <h2 className="mt-3 text-[length:var(--text-title-1)] leading-[1.05]">
                Tell us who you are
              </h2>
              <p className="text-ink-2 mt-5 max-w-[40ch] text-[length:var(--text-body)] leading-relaxed">
                A person reads every application, usually within a week. If it is a fit, the next
                step is a conversation, not a test.
              </p>
            </div>
            <div className="bento p-6 sm:p-9">
              {jobs.map((j) => (
                <span key={j.id} id={`apply-${j.id}`} className="block scroll-mt-28" />
              ))}
              <ApplyForm roles={jobs.map((j) => ({ id: j.id, title: j.title }))} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
