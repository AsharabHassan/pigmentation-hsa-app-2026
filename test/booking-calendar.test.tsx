import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingCalendar } from "@/components/result/BookingCalendar";
import { BookingCTA } from "@/components/result/BookingCTA";
import { useWizard } from "@/store/wizard-store";

describe("booking access when embedded calendars are blocked", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useWizard.getState().reset();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("keeps a direct link available and recovers from a blank frame", () => {
    render(<BookingCalendar />);
    const frame = screen.getByTitle("Choose your free online consultation time");
    fireEvent.load(frame);
    act(() => vi.advanceTimersByTime(12_000));
    expect(screen.getByRole("status")).toHaveTextContent("hasn’t connected");
    expect(screen.getByRole("link", { name: "Open available times in a new tab" })).toHaveAttribute("target", "_blank");
    fireEvent.click(screen.getByRole("button", { name: "Retry calendar" }));
    expect(screen.getByTitle("Choose your free online consultation time")).not.toBe(frame);
    expect(screen.getByRole("status")).toHaveTextContent("Loading available times");
  });

  it("only accepts a ready message from its own calendar frame and origin", () => {
    render(<BookingCalendar />);
    const frame = screen.getByTitle("Choose your free online consultation time") as HTMLIFrameElement;
    const data = ["highlevel.setHeight", { height: 900 }];
    act(() => window.dispatchEvent(new MessageEvent("message", {
      data, origin: "https://untrusted.example", source: frame.contentWindow,
    })));
    expect(screen.getByRole("status")).toBeInTheDocument();
    act(() => window.dispatchEvent(new MessageEvent("message", {
      data, origin: new URL(frame.src).origin, source: frame.contentWindow,
    })));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(frame.style.height).toBe("900px");
  });

  it("initializes the provider resizer and displays the frame after its reply", () => {
    render(<BookingCalendar />);
    const frame = screen.getByTitle("Choose your free online consultation time") as HTMLIFrameElement;
    const post = vi.spyOn(frame.contentWindow!, "postMessage");
    fireEvent.load(frame);
    expect(post).toHaveBeenCalledWith(expect.stringContaining("[iFrameSizer]hsa-consultation-calendar:"), new URL(frame.src).origin);
    act(() => window.dispatchEvent(new MessageEvent("message", {
      data: "[iFrameSizer]hsa-consultation-calendar:920:500:init",
      origin: new URL(frame.src).origin, source: frame.contentWindow,
    })));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(frame.style.height).toBe("925px");
  });

  it("keeps the top result CTA on-page and preserves calendar contact prefill", () => {
    useWizard.getState().setLead({ firstName: "Example", lastName: "Visitor", email: "example@example.com", phone: "07700900123" });
    render(<><BookingCTA label="Book your free consultation" placement="top" /><BookingCalendar /></>);
    const calendar = screen.getByRole("region", { name: "Book your free consultation" });
    calendar.scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "Book your free consultation" }));
    expect(calendar.scrollIntoView).toHaveBeenCalled();
    expect(calendar).toHaveFocus();
    const frame = screen.getByTitle("Choose your free online consultation time") as HTMLIFrameElement;
    const url = new URL(frame.src);
    expect(url.searchParams.get("first_name")).toBe("Example");
    expect(url.searchParams.get("phone")).toBe("+447700900123");
  });
});
