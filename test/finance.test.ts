import { describe, expect, it } from "vitest";
import { courseTotal, financePlan, monthlyPayment } from "@/lib/finance";

describe("finance plans", () => {
  it("prices a course from the per-session from-price, never below two sessions", () => {
    expect(courseTotal(2)).toBe(798);
    expect(courseTotal(1)).toBe(798);
    expect(courseTotal(3)).toBe(1197);
  });

  it("splits Klarna into 3 and Clearpay into 4 with no interest", () => {
    const klarna = financePlan("klarna", 798);
    expect(klarna.perPayment).toBe(266);
    expect(klarna.totalRepayable).toBe(798);
    expect(klarna.schedule).toHaveLength(3);

    const clearpay = financePlan("clearpay", 798);
    expect(clearpay.perPayment).toBe(199.5);
    expect(clearpay.schedule).toHaveLength(4);
  });

  it("applies the providers' caps from the clinic's finance page", () => {
    expect(financePlan("clearpay", 1197).available).toBe(false); // over £1,000
    expect(financePlan("klarna", 1197).available).toBe(true);
    expect(financePlan("klarna", 1596).available).toBe(false); // over £1,500
    expect(financePlan("ideal4finance", 2394).available).toBe(true);
  });

  it("matches the website's 12.9% APR monthly illustration", () => {
    // Same formula as harleystreetaesthetic.co.uk/london/finance.
    expect(monthlyPayment(1000, 12, 0.129)).toBeCloseTo(89.27, 2);
    const loan = financePlan("ideal4finance", 798, 12);
    expect(loan.dueToday).toBe(0);
    expect(loan.perPayment).toBeCloseTo(71.24, 1);
    expect(loan.totalRepayable).toBeGreaterThan(798);
  });
});
