import { redirect } from 'next/navigation';
import { Download, ExternalLink } from 'lucide-react';
import { PortalCard, StatusPill } from '@/components/portal/ui';
import { getPortalSession } from '@/lib/portal/auth';
import { dateIN, inr, invoicesFor } from '@/lib/portal/data';

export const metadata = { title: 'Invoices' };

export default async function PortalInvoices() {
  const session = await getPortalSession();
  if (!session) redirect('/portal');
  const invoices = await invoicesFor(session.active.id);
  const outstanding = invoices.reduce((n, i) => n + i.balance, 0);
  return (
    <>
      <h1 className="text-[length:var(--text-title-1)] leading-[1.1]">Invoices</h1>
      <p className="text-ink-2 mt-2 text-[0.9375rem]">
        Outstanding: <strong className="text-ink tabular-nums">{inr(outstanding)}</strong>
      </p>
      <PortalCard className="mt-8">
        {invoices.length ? (
          <div className="scroll-lane">
            <table className="w-full min-w-[40rem] text-left">
              <caption className="sr-only">Your invoices</caption>
              <thead>
                <tr className="border-b border-[var(--hairline)]">
                  {['Invoice', 'Date', 'Due', 'Total', 'Balance', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="text-ink-3 px-5 py-3 text-[0.6875rem] font-semibold tracking-[0.05em] uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)]">
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td className="text-ink px-5 py-3 text-[0.875rem] font-medium">{i.number}</td>
                    <td className="text-ink-2 px-5 py-3 text-[0.8125rem]">{dateIN(i.date)}</td>
                    <td className="text-ink-2 px-5 py-3 text-[0.8125rem]">{dateIN(i.due)}</td>
                    <td className="text-ink px-5 py-3 text-[0.875rem] tabular-nums">
                      {inr(i.total)}
                    </td>
                    <td className="text-ink px-5 py-3 text-[0.875rem] font-semibold tabular-nums">
                      {inr(i.balance)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={i.status} />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {i.source === 'books' ? (
                        <>
                          <a
                            href={`/api/portal/invoices/${i.id}/pdf`}
                            className="text-accent mr-3 inline-flex h-9 items-center gap-1 text-[0.8125rem] font-semibold"
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
                          </a>
                          {i.balance > 0 ? (
                            <a
                              href={`/api/portal/invoices/${i.id}/open`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent inline-flex h-9 items-center gap-1 text-[0.8125rem] font-semibold"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> View &amp; pay
                            </a>
                          ) : null}
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-ink-3 px-5 py-8 text-[0.875rem]">No invoices yet.</p>
        )}
      </PortalCard>
    </>
  );
}
