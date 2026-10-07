import { ADMIN_FIELD, Field, PageHeader, Panel, Pill } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { resetPricing, savePricing } from '@/app/admin/_actions/quotes';
import { requireRole } from '@/lib/auth';
import { DEFAULT_CATALOG } from '@/lib/quotes/catalog-data';
import { getCatalog, inr } from '@/lib/quotes/engine';
import { CATEGORIES } from '@/lib/quotes/types';
import { serviceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pricing' };

const PERIOD = { once: '', month: ' / month', year: ' / year' } as const;

/**
 * The price list behind every quotation. Nothing here is shown on the public
 * website: a change reaches only quotations created from now on (quotations
 * already sent keep the prices they were sent with).
 */
export default async function PricingPage() {
  await requireRole('admin');
  const catalog = await getCatalog();
  const supabase = serviceClient();
  const edited = new Set<string>();
  if (supabase) {
    const { data } = await supabase
      .from('quote_services')
      .select('service_id, prices, note, value_note, related, active');
    for (const r of data ?? []) {
      if (
        Object.keys(r.prices ?? {}).length ||
        r.note ||
        r.value_note ||
        r.related ||
        r.active === false
      )
        edited.add(r.service_id);
    }
  }
  return (
    <>
      <PageHeader
        title="Pricing"
        description="Your professional fees for every service, as they appear on quotations. Change a number and every quotation made from now on uses it. Government fees are separate lines at actual cost. Leave a field blank to keep the standard value."
      />
      <div className="grid gap-8">
        {CATEGORIES.map((c) => {
          const list = catalog.filter((s) => s.cat === c.id);
          return (
            <section key={c.id} aria-labelledby={`cat-${c.id}`}>
              <h2 id={`cat-${c.id}`} className="text-ink mb-3 text-[1.0625rem] font-semibold">
                {c.label}
              </h2>
              <div className="grid gap-3">
                {list.map((s) => {
                  const def = DEFAULT_CATALOG.find((d) => d.id === s.id)!;
                  return (
                    <Panel key={s.id}>
                      <details>
                        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-6 py-4">
                          <span className="text-ink text-[0.9375rem] font-semibold">{s.name}</span>
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-ink-3 text-[0.8125rem] tabular-nums">
                              {s.variants.length > 1 ? 'from ' : s.from ? 'from ' : ''}
                              {inr(Math.min(...s.variants.map((v) => v.price)))}
                              {PERIOD[s.variants[0]!.period]}
                            </span>
                            {edited.has(s.id) ? <Pill tone="accent">edited</Pill> : null}
                            {!s.active ? <Pill tone="caution">hidden</Pill> : null}
                          </span>
                        </summary>
                        <form
                          action={savePricing}
                          className="grid gap-4 border-t border-[var(--hairline)] px-6 py-5"
                        >
                          <input type="hidden" name="service_id" value={s.id} />
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {s.variants.map((v, i) => (
                              <Field
                                key={v.id}
                                label={`${v.label || 'Fee'}${PERIOD[v.period]} (₹)`}
                                htmlFor={`p-${s.id}-${v.id}`}
                                hint={`Standard ${inr(def.variants[i]!.price)}`}
                              >
                                <input
                                  id={`p-${s.id}-${v.id}`}
                                  name={`price_${v.id}`}
                                  type="number"
                                  min={0}
                                  defaultValue={v.price !== def.variants[i]!.price ? v.price : ''}
                                  placeholder={String(def.variants[i]!.price)}
                                  className={ADMIN_FIELD}
                                />
                              </Field>
                            ))}
                          </div>

                          {s.govFees.length ? (
                            <div>
                              <p className="text-ink-3 mb-2 text-[0.75rem] font-semibold tracking-[0.06em] uppercase">
                                Government charges (shown separately, at actual cost)
                              </p>
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {s.govFees.map((g, i) => (
                                  <Field
                                    key={g.label}
                                    label={`${g.label} (₹)`}
                                    htmlFor={`g-${s.id}-${i}`}
                                    hint={
                                      def.govFees[i]!.amount === null
                                        ? 'Standard: “confirmed before we file”. Enter an amount to show an indicative figure.'
                                        : `Standard ${inr(def.govFees[i]!.amount!)}. Check against the current notified fee.`
                                    }
                                  >
                                    <input
                                      id={`g-${s.id}-${i}`}
                                      name={`gov_${i}`}
                                      type="number"
                                      min={0}
                                      defaultValue={
                                        g.amount !== def.govFees[i]!.amount && g.amount !== null
                                          ? g.amount
                                          : ''
                                      }
                                      placeholder={
                                        def.govFees[i]!.amount === null
                                          ? 'at actual'
                                          : String(def.govFees[i]!.amount)
                                      }
                                      className={ADMIN_FIELD}
                                    />
                                  </Field>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <Field
                            label="Note under the price"
                            htmlFor={`n-${s.id}`}
                            hint="For example what is included. Clients see this."
                          >
                            <input
                              id={`n-${s.id}`}
                              name="note"
                              defaultValue={s.note}
                              className={ADMIN_FIELD}
                            />
                          </Field>
                          <Field
                            label="Why it is worth it"
                            htmlFor={`v-${s.id}`}
                            hint="One line, shown in italics under the service on the quotation. Value, not features."
                          >
                            <input
                              id={`v-${s.id}`}
                              name="value_note"
                              defaultValue={s.value}
                              className={ADMIN_FIELD}
                            />
                          </Field>
                          <Field
                            label="Suggest alongside this (service ids)"
                            htmlFor={`r-${s.id}`}
                            hint="Comma-separated ids, e.g. gstret, books. These appear as one-tap additions with their price."
                          >
                            <input
                              id={`r-${s.id}`}
                              name="related"
                              defaultValue={s.related.join(', ')}
                              className={ADMIN_FIELD}
                            />
                          </Field>
                          <label className="text-ink flex items-center gap-2.5 text-[0.875rem] font-medium">
                            <input
                              type="checkbox"
                              name="active"
                              defaultChecked={s.active}
                              className="h-4 w-4 accent-[var(--accent)]"
                            />
                            Offer this service in quotation requests
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <SubmitButton>Save</SubmitButton>
                          </div>
                        </form>
                        {edited.has(s.id) ? (
                          <form
                            action={resetPricing}
                            className="border-t border-[var(--hairline)] px-6 py-3"
                          >
                            <input type="hidden" name="service_id" value={s.id} />
                            <SubmitButton
                              tone="quiet"
                              confirm="Go back to the standard values for this service?"
                              pendingText="…"
                            >
                              Reset to standard
                            </SubmitButton>
                          </form>
                        ) : null}
                      </details>
                    </Panel>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <p className="text-ink-3 mt-8 max-w-2xl text-[0.8125rem] leading-relaxed">
        Service ids for suggestions: {DEFAULT_CATALOG.map((d) => d.id).join(', ')}.
      </p>
    </>
  );
}
