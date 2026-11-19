import { describe, expect, it } from "vitest";
import { courseBreakdown, courseTotal, financePlan, monthlyPayment } from "@/lib/finance";

describe("finance plans", () => {
  it("prices single sessions at 299 each", () => {
    expect(courseTotal(1)).toBe(299);
    expect(courseTotal(0)).toBe(299); // never below one session
    expect(courseTotal(2)).toBe(598);
    expect(courseTotal(3)).toBe(897);
  });

  it("prices a course of 4 at 999, not 4 x 299", () => {
    expect(courseTotal(4)).toBe(999);
    expect(courseBreakdown(4)).toEqual({ sessions: 4, courses: 1, singles: 0, total: 999 });
  });

  it("adds sessions beyond a course at the per-session price, up to 8", () => {
    expect(courseTotal(5)).toBe(1298);
    expect(courseTotal(6)).toBe(1597);
    expect(courseTotal(8)).toBe(1998);
    expect(courseTotal(12)).toBe(1998); // capped at 8 sessions
  });

  it("keeps the course of 4 inside Klarna and Clearpay limits", () => {
    expect(financePlan("klarna", courseTotal(4)).perPayment).toBe(333);
    expect(financePlan("clearpay", courseTotal(4)).available).toBe(true);
    expect(financePlan("clearpay", courseTotal(4)).perPayment).toBe(249.75);
  });

  it("splits Klarna into 3 and Clearpay into 4 with no interest", () => {
    const klarna = financePlan("klarna", 698);
    expect(klarna.perPayment).toBe(232.67);
    expect(klarna.totalRepayable).toBe(698);
    expect(klarna.schedule).toHaveLength(3);

    const clearpay = financePlan("clearpay", 698);
    expect(clearpay.perPayment).toBe(174.5);
    expect(clearpay.schedule).toHaveLength(4);
  });

  it("applies the providers' caps from the clinic's finance page", () => {
    expect(financePlan("clearpay", 1047).available).toBe(false); // over £1,000
    expect(financePlan("klarna", 1047).available).toBe(true);
    expect(financePlan("klarna", 1596).available).toBe(false); // over £1,500
    expect(financePlan("ideal4finance", 2394).available).toBe(true);
  });

  it("matches the website's 12.9% APR monthly illustration", () => {
    // Same formula as harleystreetaesthetic.co.uk/london/finance.
    expect(monthlyPayment(1000, 12, 0.129)).toBeCloseTo(89.27, 2);
    const loan = financePlan("ideal4finance", 698, 12);
    expect(loan.dueToday).toBe(0);
    expect(loan.perPayment).toBeCloseTo(62.31, 1);
    expect(loan.totalRepayable).toBeGreaterThan(698);
  });
});
