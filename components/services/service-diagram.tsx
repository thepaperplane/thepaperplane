import {
  AppealScene,
  CompanyScene,
  DemandScene,
  ExportScene,
  GstScene,
  IncomeTaxScene,
  NoticeReplyScene,
  PartnershipScene,
  ProjectReportScene,
  ProprietorshipScene,
  ReassessmentScene,
} from '@/components/services/scenes-advisory';
import {
  AccountingSystemsScene,
  AutomationScene,
  BookkeepingScene,
  BrandScene,
  DeckScene,
  FinancialSaasScene,
  InternalAuditScene,
  MarketingScene,
  PayrollScene,
  WebAppScene,
  WebDesignScene,
} from '@/components/services/scenes-engineering';

/**
 * Service id to scene.
 *
 * Keyed by the `id` in content/services.ts. A service with no entry renders
 * nothing rather than a placeholder — a missing scene should be invisible,
 * not a grey box announcing that something is missing.
 */
const REGISTRY: Record<string, () => React.ReactElement> = {
  /* Tax Architecture & GST */
  'income-tax-filing': IncomeTaxScene,
  'master-gst': GstScene,
  'export-import': ExportScene,

  /* Scrutiny Defence & Appeals */
  'sec-143-142': NoticeReplyScene,
  'sec-148': ReassessmentScene,
  'demand-penalty': DemandScene,
  appeals: AppealScene,

  /* Structuring & Incorporation */
  'company-incorporation': CompanyScene,
  proprietorship: ProprietorshipScene,
  partnership: PartnershipScene,
  'project-reports': ProjectReportScene,

  /* Books & Audit Readiness */
  bookkeeping: BookkeepingScene,
  'internal-audit': InternalAuditScene,
  'accounting-systems': AccountingSystemsScene,
  'payroll-hrms': PayrollScene,

  /* Digital Infrastructure */
  'web-design': WebDesignScene,
  'web-apps': WebAppScene,
  'financial-saas': FinancialSaasScene,
  automation: AutomationScene,

  /* Brand & Visual Design */
  'brand-identity': BrandScene,
  'pitch-collateral': DeckScene,
  'marketing-systems': MarketingScene,
};

export function ServiceDiagram({ id }: { id: string }) {
  const Scene = REGISTRY[id];
  if (!Scene) return null;
  return <Scene />;
}

export const SERVICE_DIAGRAM_IDS = Object.keys(REGISTRY);
