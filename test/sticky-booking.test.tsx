import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StickyBookingBar } from "@/components/result/BookingCTA";

const mocks = vi.hoisted(() => ({ book: vi.fn(), insight: vi.fn() }));
vi.mock("@/components/result/BookingCalendar", () => ({ BOOKING_ANCHOR_ID: "book", scrollToBooking: mocks.book }));
vi.mock("@/lib/visit-context", () => ({ trackInsight: mocks.insight }));
vi.mock("@/store/wizard-store", () => ({ useWizard: (select: (state: unknown) => unknown) => select({ result: { analysisId: "preview-analysis" } }) }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("mobile report consultation bar", () => {
  it("escapes the animated ancestor and sends the existing sticky booking event", () => {
    const { container } = render(<div style={{ filter: "blur(0px)", transform: "translateY(0)" }}><StickyBookingBar label="Free online consultation" /></div>);
    const bar = screen.getByRole("region", { name: "Mobile consultation booking" });
    expect(bar.parentElement).toBe(document.body);
    expect(container).not.toContainElement(bar);
    fireEvent.click(screen.getByRole("button", { name: "Free online consultation" }));
    expect(mocks.book).toHaveBeenCalledTimes(1);
    expect(mocks.insight).toHaveBeenCalledWith("preview-analysis", "cta_click", "sticky");
  });
  it("gets out of the way when the calendar is visible and returns when it leaves", () => {
    let visibility!: IntersectionObserverCallback;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) { visibility = callback; }
      observe = vi.fn(); disconnect = vi.fn();
    });
    render(<><div id="book" /><StickyBookingBar label="Free online consultation" /></>);
    act(() => visibility([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(screen.queryByRole("region", { name: "Mobile consultation booking" })).not.toBeInTheDocument();
    act(() => visibility([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(screen.getByRole("button", { name: "Free online consultation" })).toBeInTheDocument();
  });
});
