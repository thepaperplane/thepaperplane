'use client';

import { useActionState } from 'react';
import { ADMIN_FIELD, Field } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { saveSettings, type SettingsResult } from '@/app/admin/_actions/site';
import type { SiteSettings } from '@/lib/settings';

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useActionState<SettingsResult | null, FormData>(saveSettings, null);
  const { contact: c, announcement: a, social: s } = settings;

  return (
    <form action={action} className="space-y-8">
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="text-ink mb-3 text-[0.9375rem] font-semibold">
          Contact details shown on the site
        </legend>
        <Field label="Phone, as displayed" htmlFor="s-phone" required>
          <input
            id="s-phone"
            name="phone"
            required
            defaultValue={c.phone}
            className={ADMIN_FIELD}
          />
        </Field>
        <Field
          label="Phone for dialling"
          htmlFor="s-phoneIntl"
          required
          hint="With country code, e.g. +919025565526"
        >
          <input
            id="s-phoneIntl"
            name="phoneIntl"
            required
            defaultValue={c.phoneIntl}
            className={ADMIN_FIELD}
          />
        </Field>
        <Field label="Email" htmlFor="s-email" required>
          <input
            id="s-email"
            name="email"
            type="email"
            required
            defaultValue={c.email}
            className={ADMIN_FIELD}
          />
        </Field>
        <Field
          label="WhatsApp number"
          htmlFor="s-wa"
          required
          hint="Digits with country code, no plus sign."
        >
          <input
            id="s-wa"
            name="whatsapp"
            required
            defaultValue={c.whatsapp}
            className={ADMIN_FIELD}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Working hours" htmlFor="s-hours" required>
            <input
              id="s-hours"
              name="hours"
              required
              defaultValue={c.hours}
              className={ADMIN_FIELD}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="text-ink mb-3 text-[0.9375rem] font-semibold">Announcement</legend>
        <label className="text-ink flex items-center gap-2.5 text-[0.875rem] font-medium md:col-span-2">
          <input
            type="checkbox"
            name="announcement_enabled"
            defaultChecked={a.enabled}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Show a small announcement on every page
        </label>
        <div className="md:col-span-2">
          <Field
            label="Message"
            htmlFor="s-atext"
            hint="Keep it to one sentence — an offer, an opening, a deadline reminder."
          >
            <input
              id="s-atext"
              name="announcement_text"
              defaultValue={a.text}
              className={ADMIN_FIELD}
              maxLength={220}
            />
          </Field>
        </div>
        <Field label="Link" htmlFor="s-ahref" hint="A page like /contact or a full https:// link.">
          <input
            id="s-ahref"
            name="announcement_href"
            defaultValue={a.href}
            className={ADMIN_FIELD}
          />
        </Field>
        <Field label="Link text" htmlFor="s-acta">
          <input id="s-acta" name="announcement_cta" defaultValue={a.cta} className={ADMIN_FIELD} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="text-ink mb-3 text-[0.9375rem] font-semibold">
          Social profiles (shown in the footer)
        </legend>
        {(
          [
            ['linkedin', 'LinkedIn', s.linkedin],
            ['instagram', 'Instagram', s.instagram],
            ['x', 'X (Twitter)', s.x],
            ['youtube', 'YouTube', s.youtube],
          ] as const
        ).map(([name, label, value]) => (
          <Field key={name} label={label} htmlFor={`s-${name}`}>
            <input
              id={`s-${name}`}
              name={name}
              type="url"
              defaultValue={value}
              placeholder="https://…"
              className={ADMIN_FIELD}
            />
          </Field>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Save settings</SubmitButton>
        {state ? (
          <p
            role="status"
            className={state.ok ? 'text-positive text-[0.875rem]' : 'text-critical text-[0.875rem]'}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
