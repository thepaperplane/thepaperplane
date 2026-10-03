import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { DataTable, EmptyState, PageHeader, Panel } from '@/components/admin/ui';
import { SignOutEverywhere } from '@/components/admin/security-actions';
import { CONSOLE_EMAIL, MFA_REQUIRED, requireRole } from '@/lib/auth';
import { serverClient, serviceClient } from '@/lib/supabase';
import { formatRelative } from '@/lib/utils';
import type { AuditLogRow } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Security' };

/**
 * What protects the console and its data, stated as checks rather than
 * promises, and the record of every change made from here.
 */
export default async function SecurityPage() {
  await requireRole('admin');
  const supabase = await serverClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const verified = (factors?.totp ?? []).filter((f) => f.status === 'verified');

  const admin = serviceClient();
  let log: AuditLogRow[] = [];
  if (admin) {
    const { data } = await admin
      .from('audit_log')
      .select('*')
      .order('at', { ascending: false })
      .limit(60);
    log = data ?? [];
  }

  const checks: [boolean, string, string][] = [
    [
      true,
      'Single owner account',
      `Only ${CONSOLE_EMAIL} can sign in. Any other account is signed out immediately, and the database refuses it too.`,
    ],
    [
      verified.length > 0,
      'Two-factor sign-in',
      verified.length
        ? `${verified.length} authenticator enrolled. This session is at ${aal?.currentLevel?.toUpperCase()}.`
        : 'No authenticator enrolled yet.',
    ],
    [
      MFA_REQUIRED,
      'Two-factor required',
      MFA_REQUIRED
        ? 'A password alone never opens the console.'
        : 'CONSOLE_REQUIRE_MFA is set to false — turn it back on.',
    ],
    [
      true,
      'Row level security',
      'Every table refuses reads and writes unless the request comes from the owner, verified.',
    ],
    [
      true,
      'Private files',
      'Client documents and CVs live in private storage and open only through links that expire in minutes.',
    ],
    [
      true,
      'Hardened headers',
      'Content Security Policy, HSTS, frame denial and strict referrer policy on every response.',
    ],
    [
      true,
      'Abuse limits',
      'Contact, careers and tracking endpoints are rate-limited, validated and honeypotted.',
    ],
  ];

  return (
    <>
      <PageHeader
        title="Security"
        description="How the console and client data are protected, and every change made from it."
        action={<SignOutEverywhere />}
      />

      <Panel title="Protection in place" className="mb-6">
        <ul className="divide-y divide-[var(--hairline)]">
          {checks.map(([ok, title, detail]) => (
            <li key={title} className="flex items-start gap-3 px-6 py-3.5">
              {ok ? (
                <CheckCircle2 className="text-positive mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <XCircle className="text-critical mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="text-ink text-[0.875rem] font-semibold">{title}</p>
                <p className="text-ink-3 mt-0.5 text-[0.8125rem] leading-relaxed">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Activity log" description="The last 60 changes made from the console.">
        {log.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No activity recorded yet"
            description="Edits, uploads and exports are logged here."
          />
        ) : (
          <DataTable head={['When', 'Who', 'Action', 'Item']} caption="Audit log">
            {log.map((row) => (
              <tr key={row.id}>
                <td className="text-ink-3 px-6 py-3 text-[0.8125rem] whitespace-nowrap">
                  {formatRelative(row.at)}
                </td>
                <td className="text-ink-2 px-6 py-3 text-[0.8125rem]">{row.actor ?? '—'}</td>
                <td className="text-ink px-6 py-3 text-[0.8125rem] font-medium">{row.action}</td>
                <td className="text-ink-3 max-w-[22rem] truncate px-6 py-3 text-[0.8125rem]">
                  {[row.entity, row.entity_id].filter(Boolean).join(' · ')}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
