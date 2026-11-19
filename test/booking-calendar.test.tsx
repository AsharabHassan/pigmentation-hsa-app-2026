import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingCalendar } from "@/components/result/BookingCalendar";
import { BookingCTA } from "@/components/result/BookingCTA";
import { CRM_BOOKING_URL } from "@/lib/constants";
import { useWizard } from "@/store/wizard-store";

// The clinic's CRM booking page (app.harleystreetaesthetic.co.uk) may be
// framed, so the result page embeds it, with a plain link as a fallback.
describe("consultation booking calendar", () => {
  beforeEach(() => {
    useWizard.getState().reset();
  });
  afterEach(cleanup);

  it("embeds the CRM booking page in a sandboxed iframe", () => {
    expect(CRM_BOOKING_URL).toBe(
      "https://app.harleystreetaesthetic.co.uk/book/harley-street-aesthetic/free-online-consultation-with-aesthetic-",
    );
    const { container } = render(<BookingCalendar />);
    const frame = container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame).toHaveAttribute("src", CRM_BOOKING_URL);
    expect(frame).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    const sandbox = frame?.getAttribute("sandbox") ?? "";
    for (const token of ["allow-forms", "allow-scripts", "allow-same-origin", "allow-popups", "allow-top-navigation-by-user-activation"]) {
      expect(sandbox.split(" ")).toContain(token);
    }
    expect(frame).not.toHaveAttribute("scrolling");
    expect(screen.getByRole("status")).toHaveTextContent(/Loading available times/);
    fireEvent.load(frame!);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps a plain link to the booking page under the calendar", () => {
    render(<BookingCalendar />);
    const link = screen.getByRole("link", { name: /Open the booking page/ });
    expect(link).toHaveAttribute("href", CRM_BOOKING_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("never promises prefilled details and sends no contact data", () => {
    useWizard.getState().setLead({ firstName: "Example", lastName: "Visitor", email: "example@example.com", phone: "07700900123" });
    const { container } = render(<BookingCalendar />);
    expect(screen.queryByText(/filled in/)).toBeNull();
    const src = container.querySelector("iframe")?.getAttribute("src") ?? "";
    expect(src).toBe(CRM_BOOKING_URL);
    expect(src).not.toContain("first_name");
    expect(src).not.toContain("example%40example.com");
    expect(screen.getByText(/Example, choose/)).toBeInTheDocument();
  });

  it("keeps the top result CTA on-page and scrolls to the booking card", () => {
    render(<><BookingCTA label="Book your free consultation" placement="top" /><BookingCalendar /></>);
    const calendar = screen.getByRole("region", { name: "Book your free consultation" });
    calendar.scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "Book your free consultation" }));
    expect(calendar.scrollIntoView).toHaveBeenCalled();
    expect(calendar).toHaveFocus();
  });
});
