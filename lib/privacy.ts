export const ANALYSIS_PRIVACY_NOTICE_VERSION = "2026-07-24";
export const FULL_REPORT_RETENTION_DAYS = 15;

export function fullReportDeleteAfter(
  submittedAt: string | Date = new Date(),
): string {
  const date =
    submittedAt instanceof Date ? new Date(submittedAt) : new Date(submittedAt);
  date.setUTCDate(date.getUTCDate() + FULL_REPORT_RETENTION_DAYS);
  return date.toISOString();
}
