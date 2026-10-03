import 'server-only';
import { unstable_cache } from 'next/cache';
import { serviceClient } from './supabase';
import type { JobRow, TestimonialRow } from './database.types';

/**
 * Published records the public site renders. Cached and tagged so a save in
 * the console shows up on the next request, without a deploy.
 */

export const TESTIMONIALS_TAG = 'testimonials';
export const JOBS_TAG = 'jobs';

export const loadTestimonials = unstable_cache(
  async (): Promise<TestimonialRow[]> => {
    const supabase = serviceClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(12);
    if (error) return [];
    return data ?? [];
  },
  ['testimonials-v1'],
  { tags: [TESTIMONIALS_TAG], revalidate: 3600 },
);

export const loadOpenJobs = unstable_cache(
  async (): Promise<JobRow[]> => {
    const supabase = serviceClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_open', true)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) return [];
    return data ?? [];
  },
  ['jobs-v1'],
  { tags: [JOBS_TAG], revalidate: 3600 },
);
