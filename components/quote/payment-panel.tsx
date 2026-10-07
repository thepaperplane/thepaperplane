import QRCode from 'qrcode';
import { Smartphone } from 'lucide-react';
import { CopyButton } from '@/components/admin/form-bits';
import { inr } from '@/lib/quotes/engine';

/**
 * How to pay, shown only on an accepted *final* quotation. A scannable UPI
 * QR for desktop, a button that opens the UPI app on a phone, and the UPI ID
 * to copy. The amount is computed on the server from the agreed statement.
 */
export async function PaymentPanel({
  upiId,
  upiName,
  amount,
  reference,
}: {
  upiId: string;
  upiName: string;
  amount: number;
  reference: string;
}) {
  const link = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(reference)}`;
  const svg = await QRCode.toString(link, {
    type: 'svg',
    margin: 1,
    width: 176,
    color: { dark: '#12131a', light: '#ffffff' },
  });
  return (
    <section className="bg-surface rounded-[1.1rem] border border-[var(--hairline)]">
      <h2 className="text-ink border-b border-[var(--hairline)] px-6 py-4 font-[family-name:var(--font-sans)] text-[0.9375rem] font-semibold tracking-normal">
        Payment to begin the work
      </h2>
      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <div
          role="img"
          aria-label={`UPI QR code to pay ${inr(amount)} to ${upiId}`}
          className="mx-auto h-44 w-44 overflow-hidden rounded-xl border border-[var(--hairline)] bg-white p-1 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="grid gap-3">
          <p className="text-ink text-[1.75rem] leading-none font-semibold tabular-nums">
            {inr(amount)}
          </p>
          <p className="text-ink-2 text-[0.9375rem] leading-relaxed">
            Payment to be made through UPI to:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="bg-sunken text-ink rounded-lg px-3 py-2 text-[1rem] font-semibold">
              {upiId}
            </code>
            <CopyButton value={upiId} label="Copy UPI ID" />
          </div>
          <a
            href={link}
            className="bg-accent text-accent-ink inline-flex h-12 w-fit items-center gap-2 rounded-full px-6 text-[1rem] font-semibold"
          >
            <Smartphone className="h-4 w-4" aria-hidden="true" /> Pay with a UPI app
          </a>
          <p className="text-ink font-semibold">Please make the payment to initiate the work.</p>
          <p className="text-ink-3 text-[0.8125rem] leading-relaxed">
            This covers our professional fee. Government fees, where they apply, are paid at actual
            cost and are shown separately. Add “{reference}” as the note if your app lets you.
          </p>
        </div>
      </div>
    </section>
  );
}
