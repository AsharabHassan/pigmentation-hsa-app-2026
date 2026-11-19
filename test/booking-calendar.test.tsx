import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingCalendar } from "@/components/result/BookingCalendar";
import { BookingCTA } from "@/components/result/BookingCTA";
import { CRM_BOOKING_URL } from "@/lib/constants";
import { useWizard } from "@/store/wizard-store";

// The CRM booking page refuses to be framed (X-Frame-Options: DENY), so the
// result page links to it instead of embedding a calendar.
describe("consultation booking card", () => {
  beforeEach(() => {
    useWizard.getState().reset();
  });
  afterEach(cleanup);

  it("opens the CRM booking page in a new tab, with no iframe", () => {
    const { container } = render(<BookingCalendar />);
    const link = screen.getByRole("link", { name: /See available times/ });
    expect(link).toHaveAttribute("href", CRM_BOOKING_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText(/new tab/)).toBeInTheDocument();
  });

  it("never promises prefilled details and keeps the link free of contact data", () => {
    useWizard.getState().setLead({ firstName: "Example", lastName: "Visitor", email: "example@example.com", phone: "07700900123" });
    render(<BookingCalendar />);
    expect(screen.queryByText(/already filled in/)).toBeNull();
    const link = screen.getByRole("link", { name: /See available times/ });
    expect(link.getAttribute("href")).toBe(CRM_BOOKING_URL);
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
