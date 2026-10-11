import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
  shouldFallbackToDemoData,
} from '../../../../../lib/supabase/api-guard.ts';
import { validateJournalIntegrity } from '../../../../../lib/financial-engine.ts';
import { DEMO_JOURNAL_ENTRIES } from '../../../../../lib/mock-tms-data.ts';
import { getSupabaseServerClient } from '../../../../../lib/supabase/server.ts';

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req, {
    allowedRoles: ['superadmin', 'owner', 'accountant'],
  });
  if (!auth.success) return auth.response;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, journal_entry_lines(*)')
      .eq('organization_id', auth.session.organizationId)
      .order('entry_date', { ascending: false });

    if (error) {
      return createApiErrorResponse(error.message, 500, 'DATABASE_QUERY_ERROR');
    }
    const audit = validateJournalIntegrity(data || []);
    return createApiSuccessResponse(data || [], {
      totalEntries: data?.length || 0,
      ledgerAudit: {
        isBalanced: audit.isBalanced,
        totalDebits: audit.totalDebits,
        totalCredits: audit.totalCredits,
        discrepancy: audit.discrepancy,
        unbalancedEntriesCount: audit.unbalancedEntriesCount,
      },
    });
  }

  if (shouldFallbackToDemoData(auth.session.authMode)) {
    // RUN REAL-TIME GENERAL LEDGER INTEGRITY AUDIT
    const audit = validateJournalIntegrity(DEMO_JOURNAL_ENTRIES);

    return createApiSuccessResponse(DEMO_JOURNAL_ENTRIES, {
      totalEntries: DEMO_JOURNAL_ENTRIES.length,
      ledgerAudit: {
        isBalanced: audit.isBalanced,
        totalDebits: audit.totalDebits,
        totalCredits: audit.totalCredits,
        discrepancy: audit.discrepancy,
        unbalancedEntriesCount: audit.unbalancedEntriesCount,
      },
    });
  }

  return createApiErrorResponse(
    'Database connection is unavailable and demo mode is disabled in production.',
    503,
    'DATABASE_UNAVAILABLE'
  );
}
