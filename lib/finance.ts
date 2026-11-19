// ─────────────────────────────────────────────────────────────────────────────
// Payment-plan maths for the result page calculator and the PDF report.
//
// Mirrors the clinic's own calculator at harleystreetaesthetic.co.uk/london/finance
// so a visitor sees the same figures in both places: Klarna Pay in 3 (0%, up to
// £1,500), Clearpay Pay in 4 (0%, up to £1,000) and Ideal4Finance monthly loans
// (12–60 months, illustrated at 12.9% APR). Figures are illustrations, never an
// offer of credit — the provider decides eligibility and the final rate.
// ─────────────────────────────────────────────────────────────────────────────

/** Price of one session, in pounds. Keep in step with PRICE_GUIDE. */
export const PRICE_PER_SESSION = 299;
/** The usual starting course: 4 sessions, two weeks apart, at one course price. */
export const COURSE_SESSIONS = 4;
export const COURSE_PRICE = 999;
export const MIN_SESSIONS = 1;
/** Some people need 6 or 8 sessions. */
export const MAX_SESSIONS = 8;

export const ILLUSTRATIVE_APR = 0.129;
export const LOAN_TERMS = [12, 24, 36, 48, 60] as const;
export type LoanTerm = (typeof LOAN_TERMS)[number];

export type FinanceProviderKey = "klarna" | "clearpay" | "ideal4finance";

export interface FinanceProvider {
  key: FinanceProviderKey;
  name: string;
  plan: string;
  /** Largest treatment total the provider's plan covers; null = no set cap. */
  maxTotal: number | null;
}

export const FINANCE_PROVIDERS: FinanceProvider[] = [
  { key: "klarna", name: "Klarna", plan: "Pay in 3 · 0% interest", maxTotal: 1_500 },
  { key: "clearpay", name: "Clearpay", plan: "Pay in 4 · 0% interest", maxTotal: 1_000 },
  { key: "ideal4finance", name: "Ideal4Finance", plan: "Monthly payments", maxTotal: null },
];

export const FINANCE_DISCLAIMER =
  "Illustrative figures based on our session and course prices; your exact cost is confirmed at consultation. Klarna and Clearpay plans are interest-free; missed payments may affect your credit record and your ability to use them. Ideal4Finance figures are illustrated at 12.9% APR — the actual rate depends on your circumstances, and 0% options may be available. All finance is provided by the named lender, subject to status and affordability checks, 18+ only. Please borrow only what you can comfortably repay.";

export interface Instalment {
  label: string;
  amount: number;
}

export interface FinancePlan {
  provider: FinanceProvider;
  available: boolean;
  /** Amount paid at booking (0 for a monthly loan). */
  dueToday: number;
  /** The repeating payment a visitor anchors on. */
  perPayment: number;
  payments: number;
  totalRepayable: number;
  schedule: Instalment[];
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export interface CourseBreakdown {
  sessions: number;
  /** Full courses of 4 at the course price. */
  courses: number;
  /** Sessions outside a full course, at the per-session price. */
  singles: number;
  total: number;
}

/**
 * Prices a number of sessions: every full set of 4 at the course price (£999),
 * any remaining sessions at the per-session price (£299).
 */
export function courseBreakdown(sessions: number): CourseBreakdown {
  const count = Math.min(MAX_SESSIONS, Math.max(MIN_SESSIONS, Math.round(sessions)));
  const courses = Math.floor(count / COURSE_SESSIONS);
  const singles = count % COURSE_SESSIONS;
  return {
    sessions: count,
    courses,
    singles,
    total: courses * COURSE_PRICE + singles * PRICE_PER_SESSION,
  };
}

export function courseTotal(sessions: number): number {
  return courseBreakdown(sessions).total;
}

/** Standard amortised monthly payment. */
export function monthlyPayment(total: number, months: number, apr: number): number {
  const rate = apr / 12;
  if (rate === 0) return round2(total / months);
  const growth = Math.pow(1 + rate, months);
  return round2((total * rate * growth) / (growth - 1));
}

export function financePlan(
  key: FinanceProviderKey,
  total: number,
  term: LoanTerm = 12,
): FinancePlan {
  const provider = FINANCE_PROVIDERS.find((p) => p.key === key)!;
  const available = provider.maxTotal === null || total <= provider.maxTotal;

  if (key === "klarna" || key === "clearpay") {
    const payments = key === "klarna" ? 3 : 4;
    const labels =
      key === "klarna"
        ? ["Today", "In 30 days", "In 60 days"]
        : ["Today", "Week 2", "Week 4", "Week 6"];
    const each = round2(total / payments);
    return {
      provider,
      available,
      dueToday: each,
      perPayment: each,
      payments,
      totalRepayable: total,
      schedule: labels.map((label) => ({ label, amount: each })),
    };
  }

  const monthly = monthlyPayment(total, term, ILLUSTRATIVE_APR);
  return {
    provider,
    available,
    dueToday: 0,
    perPayment: monthly,
    payments: term,
    totalRepayable: round2(monthly * term),
    schedule: [],
  };
}

export function formatPounds(value: number): string {
  return `£${value.toLocaleString("en-GB", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
