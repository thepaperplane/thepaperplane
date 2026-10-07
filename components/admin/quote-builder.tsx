'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ADMIN_FIELD, Field } from '@/components/admin/ui';
import { SubmitButton } from '@/components/admin/form-bits';
import { cn } from '@/lib/utils';

export type BuilderService = {
  id: string;
  cat: string;
  name: string;
  active: boolean;
  from: boolean;
  defaultVariant: string;
  variants: { id: string; label: string; price: number; period: 'once' | 'month' | 'year' }[];
};

export type BuilderInitial = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  enquiry_id: string;
  client_id: string;
  requirement: string;
  note_to_client: string;
  kind: 'indicative' | 'final';
  validDays: number;
  discount: string;
  items: {
    serviceId?: string;
    variantId?: string;
    qty: number;
    unitPrice: number;
    name: string;
    unit: string;
    period: 'once' | 'month' | 'year';
  }[];
  preselect?: string[];
};

type Row = { on: boolean; variantId: string; qty: number; unitPrice: number };
type Custom = {
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  period: 'once' | 'month' | 'year';
};

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export function QuoteBuilder({
  services,
  categories,
  initial,
  action,
}: {
  services: BuilderService[];
  categories: { id: string; label: string }[];
  initial: BuilderInitial;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [rows, setRows] = useState<Record<string, Row>>(() => {
    const out: Record<string, Row> = {};
    for (const s of services) {
      const v = s.variants.find((x) => x.id === s.defaultVariant) ?? s.variants[0]!;
      out[s.id] = { on: false, variantId: v.id, qty: 1, unitPrice: v.price };
    }
    for (const i of initial.items) {
      if (!i.serviceId || !out[i.serviceId]) continue;
      out[i.serviceId] = {
        on: true,
        variantId: i.variantId ?? out[i.serviceId]!.variantId,
        qty: i.qty,
        unitPrice: i.unitPrice,
      };
    }
    for (const id of initial.preselect ?? []) if (out[id]) out[id]!.on = true;
    return out;
  });
  const [custom, setCustom] = useState<Custom[]>(() =>
    initial.items
      .filter((i) => !i.serviceId)
      .map((i) => ({
        name: i.name,
        unit: i.unit,
        qty: i.qty,
        unitPrice: i.unitPrice,
        period: i.period,
      })),
  );
  const [discount, setDiscount] = useState(initial.discount);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((r) => ({ ...r, [id]: { ...r[id]!, ...patch } }));

  const lines = useMemo(() => {
    const out: {
      serviceId?: string;
      variantId?: string;
      qty: number;
      unitPrice: number;
      name?: string;
      unit?: string;
      period?: string;
    }[] = [];
    for (const s of services) {
      const r = rows[s.id];
      if (r?.on)
        out.push({ serviceId: s.id, variantId: r.variantId, qty: r.qty, unitPrice: r.unitPrice });
    }
    for (const c of custom) if (c.name.trim()) out.push({ ...c });
    return out;
  }, [rows, custom, services]);

  const totals = useMemo(() => {
    let once = 0,
      month = 0,
      year = 0;
    for (const l of lines) {
      const s = l.serviceId ? services.find((x) => x.id === l.serviceId) : null;
      const period = s
        ? (s.variants.find((v) => v.id === l.variantId)?.period ?? 'once')
        : (l.period ?? 'once');
      const amt = l.unitPrice * l.qty;
      if (period === 'once') once += amt;
      else if (period === 'month') month += amt;
      else year += amt;
    }
    return { once, month, year };
  }, [lines, services]);

  const disc = Math.max(0, Number(discount) || 0);

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="id" value={initial.id ?? ''} />
      <input type="hidden" name="enquiry_id" value={initial.enquiry_id} />
      <input type="hidden" name="client_id" value={initial.client_id} />
      <input type="hidden" name="items" value={JSON.stringify(lines)} />

      <div className="bg-surface grid gap-4 rounded-[var(--radius-md)] border p-6 md:grid-cols-2">
        <Field label="Client name" htmlFor="qb-name" required>
          <input
            id="qb-name"
            name="name"
            required
            defaultValue={initial.name}
            className={ADMIN_FIELD}
          />
        </Field>
        <Field label="Business" htmlFor="qb-company">
          <input
            id="qb-company"
            name="company"
            defaultValue={initial.company}
            className={ADMIN_FIELD}
          />
        </Field>
        <Field label="Email" htmlFor="qb-email" hint="The quotation link is emailed here.">
          <input
            id="qb-email"
            name="email"
            type="email"
            defaultValue={initial.email}
            className={ADMIN_FIELD}
          />
        </Field>
        <Field
          label="Phone / WhatsApp"
          htmlFor="qb-phone"
          hint="If they have messaged the assistant in the last day, the link is also sent there."
        >
          <input id="qb-phone" name="phone" defaultValue={initial.phone} className={ADMIN_FIELD} />
        </Field>
        <div className="md:col-span-2">
          <Field
            label="What they need"
            htmlFor="qb-req"
            hint="For your own reference; the client does not see this."
          >
            <textarea
              id="qb-req"
              name="requirement"
              rows={2}
              defaultValue={initial.requirement}
              className={`${ADMIN_FIELD} h-auto py-3`}
            />
          </Field>
        </div>
      </div>

      <div className="bg-surface rounded-[var(--radius-md)] border">
        <div className="border-b border-[var(--hairline)] px-6 py-4">
          <h2 className="text-ink text-[0.9375rem] font-semibold">Services</h2>
          <p className="text-ink-3 mt-1 text-[0.8125rem]">
            Tick what applies. Amounts start at your price list and can be changed for this client.
          </p>
        </div>
        <div className="grid gap-6 px-6 py-5">
          {categories.map((c) => {
            const list = services.filter((s) => s.cat === c.id && (s.active || rows[s.id]?.on));
            if (!list.length) return null;
            return (
              <div key={c.id}>
                <p className="text-ink-3 text-[0.75rem] font-semibold tracking-[0.06em] uppercase">
                  {c.label}
                </p>
                <ul className="mt-2 divide-y divide-[var(--hairline)]">
                  {list.map((s) => {
                    const r = rows[s.id]!;
                    return (
                      <li
                        key={s.id}
                        className="grid items-center gap-3 py-2.5 md:grid-cols-[minmax(0,1fr)_14rem_5rem_8rem]"
                      >
                        <label className="text-ink flex items-center gap-3 text-[0.875rem] font-medium">
                          <input
                            type="checkbox"
                            checked={r.on}
                            onChange={(e) => update(s.id, { on: e.target.checked })}
                            className="h-4 w-4 accent-[var(--accent)]"
                          />
                          {s.name}
                          {!s.active ? (
                            <span className="text-ink-3 text-[0.75rem]">(hidden from clients)</span>
                          ) : null}
                        </label>
                        {s.variants.length > 1 ? (
                          <select
                            aria-label={`${s.name} option`}
                            value={r.variantId}
                            onChange={(e) =>
                              update(s.id, {
                                variantId: e.target.value,
                                unitPrice:
                                  s.variants.find((v) => v.id === e.target.value)?.price ??
                                  r.unitPrice,
                              })
                            }
                            className={cn(ADMIN_FIELD, 'h-9')}
                          >
                            {s.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label} · {inr(v.price)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-ink-3 text-[0.8125rem]">
                            {s.from ? 'from ' : ''}
                            {inr(s.variants[0]!.price)}
                            {s.variants[0]!.period === 'month'
                              ? ' / month'
                              : s.variants[0]!.period === 'year'
                                ? ' / year'
                                : ''}
                          </span>
                        )}
                        <input
                          type="number"
                          min={1}
                          max={99}
                          aria-label={`${s.name} quantity`}
                          value={r.qty}
                          onChange={(e) =>
                            update(s.id, { qty: Math.max(1, Number(e.target.value) || 1) })
                          }
                          className={cn(ADMIN_FIELD, 'h-9')}
                        />
                        <input
                          type="number"
                          min={0}
                          aria-label={`${s.name} amount`}
                          value={r.unitPrice}
                          onChange={(e) =>
                            update(s.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })
                          }
                          className={cn(ADMIN_FIELD, 'h-9')}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          <div>
            <p className="text-ink-3 text-[0.75rem] font-semibold tracking-[0.06em] uppercase">
              Custom lines
            </p>
            <ul className="mt-2 grid gap-2">
              {custom.map((c, i) => (
                <li
                  key={i}
                  className="grid items-center gap-2 md:grid-cols-[minmax(0,1fr)_9rem_6rem_5rem_8rem_2.5rem]"
                >
                  <input
                    aria-label="Custom line description"
                    placeholder="e.g. Annual report for the bank"
                    value={c.name}
                    onChange={(e) =>
                      setCustom((l) =>
                        l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    className={cn(ADMIN_FIELD, 'h-9')}
                  />
                  <input
                    aria-label="Unit"
                    placeholder="per report"
                    value={c.unit}
                    onChange={(e) =>
                      setCustom((l) =>
                        l.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)),
                      )
                    }
                    className={cn(ADMIN_FIELD, 'h-9')}
                  />
                  <select
                    aria-label="Billing"
                    value={c.period}
                    onChange={(e) =>
                      setCustom((l) =>
                        l.map((x, j) =>
                          j === i ? { ...x, period: e.target.value as Custom['period'] } : x,
                        ),
                      )
                    }
                    className={cn(ADMIN_FIELD, 'h-9')}
                  >
                    <option value="once">One-time</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    aria-label="Quantity"
                    value={c.qty}
                    onChange={(e) =>
                      setCustom((l) =>
                        l.map((x, j) =>
                          j === i ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x,
                        ),
                      )
                    }
                    className={cn(ADMIN_FIELD, 'h-9')}
                  />
                  <input
                    type="number"
                    min={0}
                    aria-label="Amount"
                    value={c.unitPrice}
                    onChange={(e) =>
                      setCustom((l) =>
                        l.map((x, j) =>
                          j === i
                            ? { ...x, unitPrice: Math.max(0, Number(e.target.value) || 0) }
                            : x,
                        ),
                      )
                    }
                    className={cn(ADMIN_FIELD, 'h-9')}
                  />
                  <button
                    type="button"
                    aria-label="Remove line"
                    onClick={() => setCustom((l) => l.filter((_, j) => j !== i))}
                    className="text-ink-3 hover:text-critical grid h-9 w-9 place-items-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                setCustom((l) => [
                  ...l,
                  { name: '', unit: '', qty: 1, unitPrice: 0, period: 'once' },
                ])
              }
              className="text-accent mt-3 inline-flex h-9 items-center gap-1.5 text-[0.875rem] font-semibold"
            >
              <Plus className="h-4 w-4" /> Add a custom line
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface grid gap-4 rounded-[var(--radius-md)] border p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field
            label="Note to the client"
            htmlFor="qb-note"
            hint="Shown at the top of their quotation. Keep it personal and short."
          >
            <textarea
              id="qb-note"
              name="note_to_client"
              rows={3}
              defaultValue={initial.note_to_client}
              className={`${ADMIN_FIELD} h-auto py-3`}
            />
          </Field>
        </div>
        <Field
          label="Quotation type"
          htmlFor="qb-kind"
          hint="Indicative is a starting estimate; Final is what you confirmed after speaking to them."
        >
          <select id="qb-kind" name="kind" defaultValue={initial.kind} className={ADMIN_FIELD}>
            <option value="indicative">Indicative — starting estimate</option>
            <option value="final">Final — confirmed</option>
          </select>
        </Field>
        <Field label="Open for (days)" htmlFor="qb-days">
          <input
            id="qb-days"
            name="validDays"
            type="number"
            min={1}
            max={180}
            defaultValue={initial.validDays}
            className={ADMIN_FIELD}
          />
        </Field>
        <Field
          label="Discount (₹, optional)"
          htmlFor="qb-disc"
          hint="Leave blank to use the automatic combination saving, if switched on."
        >
          <input
            id="qb-disc"
            name="discount"
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className={ADMIN_FIELD}
          />
        </Field>
        <div className="bg-sunken rounded-[var(--radius-md)] px-4 py-3 text-[0.875rem]">
          <p className="text-ink-3 text-[0.75rem] font-semibold tracking-[0.05em] uppercase">
            Running total
          </p>
          <p className="text-ink mt-1">
            One-time <strong>{inr(Math.max(0, totals.once - disc))}</strong>
            {disc ? <span className="text-ink-3"> (after {inr(disc)} off)</span> : null}
          </p>
          {totals.month ? (
            <p className="text-ink">
              Monthly <strong>{inr(totals.month)}</strong>
            </p>
          ) : null}
          {totals.year ? (
            <p className="text-ink">
              Yearly <strong>{inr(totals.year)}</strong>
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton name="intent" value="draft" tone="quiet" pendingText="Saving…">
          Save as draft
        </SubmitButton>
        <SubmitButton name="intent" value="send" pendingText="Sending…">
          Save and send to the client
        </SubmitButton>
        <p className="text-ink-3 text-[0.8125rem]">
          Sending emails a private link — the email itself never shows a price.
        </p>
      </div>
    </form>
  );
}
