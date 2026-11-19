"use client";

import { useState } from "react";
import { Minus, Plus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard } from "@/store/wizard-store";
import { trackInsight } from "@/lib/visit-context";
import {
  FINANCE_DISCLAIMER,
  FINANCE_PROVIDERS,
  LOAN_TERMS,
  COURSE_PRICE,
  COURSE_SESSIONS,
  MAX_SESSIONS,
  MIN_SESSIONS,
  PRICE_PER_SESSION,
  courseBreakdown,
  financePlan,
  formatPounds,
  type FinanceProviderKey,
  type LoanTerm,
} from "@/lib/finance";
import { scrollToBooking } from "./BookingCalendar";

/**
 * "Spread the cost" calculator. Same providers, caps and maths as the clinic's
 * own finance page, driven by sessions rather than a bare £ slider. It opens on
 * the usual course of 4 (one course price); extra sessions are per-session.
 */
export function FinanceCalculator() {
  const analysisId = useWizard((s) => s.result?.analysisId);
  const [sessions, setSessions] = useState(COURSE_SESSIONS);
  const [providerKey, setProviderKey] = useState<FinanceProviderKey>("klarna");
  const [term, setTerm] = useState<LoanTerm>(12);
  const [touched, setTouched] = useState(false);

  const breakdown = courseBreakdown(sessions);
  const total = breakdown.total;
  // A plan the new total no longer fits falls back to the one with no cap.
  const selectedKey = financePlan(providerKey, total).available
    ? providerKey
    : "ideal4finance";
  const plan = financePlan(selectedKey, total, term);
  const isLoan = selectedKey === "ideal4finance";

  function interact(detail: string) {
    if (!touched) {
      trackInsight(analysisId, "finance_used", detail);
      setTouched(true);
    }
  }

  function changeSessions(delta: number) {
    setSessions((n) => Math.min(MAX_SESSIONS, Math.max(MIN_SESSIONS, n + delta)));
    interact("sessions");
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-soft sm:p-7">
      <div className="flex items-center gap-2 text-peach">
        <Wallet size={17} />
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
          Spread the cost
        </span>
      </div>
      <h3 className="mt-2 font-serif text-xl text-heading">
        See what your treatment could cost per payment
      </h3>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
        <div>
          <p className="text-xs text-body/70">Sessions</p>
          <p className="text-sm text-body">
            <span className="font-semibold text-heading">{sessions}</span>{" "}
            {sessions === 1 ? "session" : "sessions"} · {priceWorking(breakdown)} ={" "}
            <span className="font-semibold text-heading">
              {formatPounds(total)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StepButton
            label="Fewer sessions"
            disabled={sessions <= MIN_SESSIONS}
            onClick={() => changeSessions(-1)}
          >
            <Minus size={15} />
          </StepButton>
          <StepButton
            label="More sessions"
            disabled={sessions >= MAX_SESSIONS}
            onClick={() => changeSessions(1)}
          >
            <Plus size={15} />
          </StepButton>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {FINANCE_PROVIDERS.map((provider) => {
          const available = financePlan(provider.key, total).available;
          const active = provider.key === selectedKey;
          return (
            <button
              key={provider.key}
              type="button"
              disabled={!available}
              aria-pressed={active}
              onClick={() => {
                setProviderKey(provider.key);
                interact(provider.key);
              }}
              className={cn(
                "rounded-2xl border px-2 py-3 text-center transition",
                active
                  ? "border-peach bg-peach text-[#090909]"
                  : "border-white/10 bg-black/30 text-body hover:border-peach/40",
                !available && "cursor-not-allowed opacity-35",
              )}
            >
              <span className="block text-[11px] font-semibold tracking-tight sm:text-[13px]">
                {provider.name}
              </span>
              <span className="mt-0.5 block text-[10px] leading-tight opacity-80">
                {available
                  ? provider.plan
                  : `Up to ${formatPounds(provider.maxTotal ?? 0)}`}
              </span>
            </button>
          );
        })}
      </div>

      {isLoan && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-body/70">Repay over</span>
          {LOAN_TERMS.map((months) => (
            <button
              key={months}
              type="button"
              aria-pressed={months === term}
              onClick={() => {
                setTerm(months);
                interact("term");
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                months === term
                  ? "border-peach bg-peach/15 text-peach"
                  : "border-white/10 text-body hover:border-peach/40",
              )}
            >
              {months} mo
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-peach/25 bg-peach/[0.06] px-5 py-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-body/70">
          {isLoan ? "Estimated monthly payment" : "Due today"}
        </p>
        <p className="mt-1 font-serif text-[40px] leading-none text-peach">
          {formatPounds(plan.perPayment)}
        </p>
        <p className="mt-2 text-[13px] text-body">
          {isLoan
            ? `for ${plan.payments} months · ${formatPounds(plan.totalRepayable)} total repayable*`
            : `then ${plan.payments - 1} more interest-free payments of ${formatPounds(plan.perPayment)}`}
        </p>

        {plan.schedule.length > 0 && (
          <ol
            className="mt-4 grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${plan.schedule.length}, minmax(0, 1fr))`,
            }}
          >
            {plan.schedule.map((step, i) => (
              <li key={step.label} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                    i === 0
                      ? "border-peach bg-peach text-[#090909]"
                      : "border-white/15 text-body",
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-[10px] leading-tight text-body/70">
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          trackInsight(analysisId, "cta_click", "finance");
          scrollToBooking();
        }}
        className="mt-4 w-full text-center text-sm font-semibold text-peach underline-offset-4 hover:underline"
      >
        Ask about payment plans on your free consultation →
      </button>

      <p className="mt-4 text-[10.5px] leading-relaxed text-body/55">
        *{FINANCE_DISCLAIMER}
      </p>
    </div>
  );
}

/** "course of 4 at £999 + 2 × £299": how the total is made up. */
function priceWorking({ courses, singles }: { courses: number; singles: number }): string {
  const parts: string[] = [];
  if (courses === 1) parts.push(`course of ${COURSE_SESSIONS} at ${formatPounds(COURSE_PRICE)}`);
  if (courses > 1) parts.push(`${courses} courses of ${COURSE_SESSIONS} at ${formatPounds(COURSE_PRICE)}`);
  if (singles > 0) parts.push(`${singles} × ${formatPounds(PRICE_PER_SESSION)}`);
  return parts.join(" + ");
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-peach/40 text-peach transition hover:bg-peach/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
