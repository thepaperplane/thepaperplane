/**
 * Database types.
 *
 * Regenerate from the live schema with:
 *   npm run db:types
 *
 * Kept hand-trimmed to the columns the app actually reads and writes, so
 * this file stays reviewable. If you add a column, add it here too (or
 * regenerate and reformat).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type ClientStatus = 'lead' | 'onboarding' | 'active' | 'dormant' | 'closed';
export type EntityType =
  | 'individual'
  | 'proprietorship'
  | 'partnership'
  | 'llp'
  | 'private_limited'
  | 'public_limited'
  | 'trust'
  | 'society'
  | 'other';
export type EngagementState = 'proposed' | 'active' | 'paused' | 'completed' | 'cancelled';
export type TaskState = 'pending' | 'in_progress' | 'blocked' | 'done' | 'not_applicable';
export type SubscriberState = 'pending' | 'confirmed' | 'unsubscribed' | 'bounced';
export type SubscriberSegment = 'business' | 'professional' | 'individual';
export type EnquiryState = 'new' | 'contacted' | 'qualified' | 'converted' | 'archived' | 'spam';
export type ProjectStatus = 'draft' | 'staged' | 'live' | 'archived';
export type CaptureStatus = 'pending' | 'capturing' | 'ready' | 'failed' | 'unreachable';
export type ApplicationStatus =
  'new' | 'reviewing' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  name: string;
  legal_name: string | null;
  entity_type: EntityType;
  status: ClientStatus;
  pan: string | null;
  gstin: string | null;
  cin: string | null;
  tan: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  jurisdiction: string | null;
  financial_year_end: string | null;
  owner_id: string | null;
  source: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type ClientContactRow = {
  id: string;
  client_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
};

export type EngagementRow = {
  id: string;
  client_id: string;
  service_id: string;
  service_name: string;
  pillar_id: string;
  state: EngagementState;
  fee_amount: number | null;
  fee_currency: string;
  billing_cycle: string | null;
  started_on: string | null;
  ends_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OnboardingTaskRow = {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  state: TaskState;
  due_on: string | null;
  position: number;
  assignee_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  segment: SubscriberSegment;
  state: SubscriberState;
  token: string;
  client_id: string | null;
  source: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  last_sent_at: string | null;
  send_count: number;
  created_at: string;
  updated_at: string;
};

export type EnquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service_id: string | null;
  subject: string | null;
  message: string;
  state: EnquiryState;
  client_id: string | null;
  assignee_id: string | null;
  user_agent: string | null;
  referrer: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarSendRow = {
  id: string;
  subscriber_id: string;
  period: string;
  status: string;
  provider_id: string | null;
  error: string | null;
  sent_at: string;
};

export type ContentBlockRow = {
  id: string;
  page: string;
  slot: string;
  label: string;
  kind: string;
  value: Json;
  is_published: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  url: string;
  display_url: string;
  sector: string | null;
  year: number | null;
  summary: string | null;
  brief: string | null;
  stack: string[];
  highlights: Json;
  status: ProjectStatus;
  status_note: string | null;
  position: number;
  capture_status: CaptureStatus;
  desktop_shot_path: string | null;
  mobile_shot_path: string | null;
  captured_at: string | null;
  capture_error: string | null;
  last_http_status: number | null;
  last_checked_at: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsSourceRow = {
  id: string;
  name: string;
  feed_url: string;
  site_url: string | null;
  category: string;
  is_active: boolean;
  fetch_count: number;
  error_count: number;
  last_error: string | null;
  last_fetched_at: string | null;
  created_at: string;
};

export type NewsItemRow = {
  id: string;
  source_id: string | null;
  source_name: string;
  category: string;
  title: string;
  link: string;
  summary: string | null;
  author: string | null;
  published_at: string;
  fingerprint: string;
  is_featured: boolean;
  is_hidden: boolean;
  fetched_at: string;
};

export type SiteSettingRow = {
  key: string;
  value: Json;
  updated_at: string;
};

export type TestimonialRow = {
  id: string;
  quote: string;
  author_name: string;
  author_role: string | null;
  company: string | null;
  avatar_url: string | null;
  project_slug: string | null;
  rating: number | null;
  is_published: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type JobRow = {
  id: string;
  slug: string;
  title: string;
  team: string | null;
  location: string;
  employment_type: string;
  experience: string | null;
  summary: string | null;
  description: string | null;
  responsibilities: string[];
  requirements: string[];
  is_open: boolean;
  position: number;
  closes_on: string | null;
  created_at: string;
  updated_at: string;
};

export type JobApplicationRow = {
  id: string;
  job_id: string | null;
  job_title: string | null;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  experience_years: number | null;
  cover_note: string | null;
  resume_path: string | null;
  status: ApplicationStatus;
  rating: number | null;
  notes: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientDocumentRow = {
  id: string;
  client_id: string;
  title: string;
  category: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  notes: string | null;
  created_at: string;
};

export type TaskRow = {
  id: string;
  client_id: string | null;
  title: string;
  details: string | null;
  due_on: string | null;
  state: TaskState;
  priority: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceRow = {
  id: string;
  client_id: string;
  number: string;
  description: string | null;
  issued_on: string;
  due_on: string | null;
  amount: number;
  tax_amount: number;
  currency: string;
  status: InvoiceStatus;
  paid_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EnquiryMetaRow = {
  enquiry_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_path: string | null;
  budget: string | null;
  timeline: string | null;
  value_estimate: number | null;
  follow_up_on: string | null;
  updated_at: string;
};

export type ProjectMediaRow = {
  project_id: string;
  desktop_full_path: string | null;
  mobile_full_path: string | null;
  is_featured: boolean;
  outcome: string | null;
  updated_at: string;
};

export type PageViewRow = {
  day: string;
  path: string;
  referrer_host: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  device: string;
  country: string;
  views: number;
};

export type AuditLogRow = {
  id: number;
  at: string;
  actor: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detail: Json;
};

/** Shape expected by `createClient<Database>()`. */
type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      clients: TableDef<ClientRow>;
      client_contacts: TableDef<ClientContactRow>;
      engagements: TableDef<EngagementRow>;
      onboarding_tasks: TableDef<OnboardingTaskRow>;
      subscribers: TableDef<SubscriberRow>;
      enquiries: TableDef<EnquiryRow>;
      calendar_sends: TableDef<CalendarSendRow>;
      content_blocks: TableDef<ContentBlockRow>;
      projects: TableDef<ProjectRow>;
      news_sources: TableDef<NewsSourceRow>;
      news_items: TableDef<NewsItemRow>;
      site_settings: TableDef<SiteSettingRow>;
      testimonials: TableDef<TestimonialRow>;
      jobs: TableDef<JobRow>;
      job_applications: TableDef<JobApplicationRow>;
      client_documents: TableDef<ClientDocumentRow>;
      tasks: TableDef<TaskRow>;
      invoices: TableDef<InvoiceRow>;
      enquiry_meta: TableDef<EnquiryMetaRow>;
      project_media: TableDef<ProjectMediaRow>;
      page_views: TableDef<PageViewRow>;
      audit_log: TableDef<AuditLogRow>;
    };
    Views: Record<never, never>;
    Functions: {
      has_role: { Args: { required: AppRole[] }; Returns: boolean };
      is_staff: { Args: Record<never, never>; Returns: boolean };
      seed_onboarding: { Args: { target_client: string }; Returns: undefined };
      analytics_daily: { Args: { p_from: string }; Returns: { day: string; views: number }[] };
      analytics_top: {
        Args: { p_from: string; p_dim: string; p_limit?: number };
        Returns: { label: string; views: number }[];
      };
      track_view: {
        Args: {
          p_path: string;
          p_referrer: string;
          p_source: string;
          p_medium: string;
          p_campaign: string;
          p_device: string;
          p_country: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: AppRole;
      client_status: ClientStatus;
      entity_type: EntityType;
      engagement_state: EngagementState;
      task_state: TaskState;
      subscriber_state: SubscriberState;
      subscriber_segment: SubscriberSegment;
      enquiry_state: EnquiryState;
      project_status: ProjectStatus;
      capture_status: CaptureStatus;
      application_status: ApplicationStatus;
      invoice_status: InvoiceStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
