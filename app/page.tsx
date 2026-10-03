import { Hero } from '@/components/home/hero';
import {
  CareersTeaser,
  Closing,
  FeaturedWork,
  MonthStrip,
  Offer,
  Outcomes,
  Problems,
  Process,
  ServiceBand,
  Statement,
  Testimonials,
} from '@/components/home/sections';
import { engagementHowToJsonLd, jsonLdScript } from '@/lib/schema';
import { loadPortfolio } from '@/lib/portfolio';
import { getSettings } from '@/lib/settings';
import { loadOpenJobs, loadTestimonials } from '@/lib/public-data';

/**
 * The homepage, in the order a visitor's questions arrive:
 *
 *   What is this, and is it for me?          Hero
 *   Do they understand my problem?           Problems
 *   What exactly would I get?                Offer
 *   What is different about working here?    Outcomes
 *   Can they actually do it?                 Work (scroll the real sites)
 *   Why one firm rather than three?          Statement
 *   What happens after I get in touch?       Process
 *   Who else trusted them?                   Testimonials, when there are any
 *   How do I start?                          Close
 *
 * Revalidated hourly, and on demand whenever the console saves copy, a
 * project, a testimonial or a setting.
 */
export const revalidate = 3600;

export default async function HomePage() {
  const [projects, settings, testimonials, jobs] = await Promise.all([
    loadPortfolio(),
    getSettings(),
    loadTestimonials(),
    loadOpenJobs(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(engagementHowToJsonLd()) }}
      />
      <Hero />
      <ServiceBand />
      <Problems />
      <Offer />
      <Outcomes />
      <FeaturedWork projects={projects} />
      <Statement />
      <Process />
      <Testimonials items={testimonials} />
      <MonthStrip />
      <CareersTeaser openRoles={jobs.length} />
      <Closing settings={settings} />
    </>
  );
}
