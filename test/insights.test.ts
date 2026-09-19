import { describe, expect, it } from "vitest";
import {
  bookingStatus,
  deviceFromUserAgent,
  phoneKey,
  topZone,
  visitContextSchema,
} from "@/lib/insights";
import { prefilledCalendarUrl, toE164Uk } from "@/lib/constants";

describe("insights helpers", () => {
  it("matches the same UK phone whatever format GoHighLevel reports", () => {
    const key = phoneKey("07700 900123");
    expect(key).toBe("7700900123");
    expect(phoneKey("+44 7700 900123")).toBe(key);
    expect(phoneKey("447700900123")).toBe(key);
    expect(phoneKey("12")).toBeNull();
  });

  it("picks the most prominent zone that was actually readable", () => {
    expect(
      topZone({
        zoneSeverity: { cheeks: 62, forehead: 80, nose: 20 },
        zonesObscured: ["forehead"],
      }),
    ).toEqual({ zone: "cheeks", severity: 62 });
    expect(topZone({ zoneSeverity: {}, zonesObscured: [] })).toBeNull();
  });

  it("collapses GoHighLevel appointment statuses", () => {
    expect(bookingStatus("confirmed")).toBe("booked");
    expect(bookingStatus(undefined)).toBe("booked");
    expect(bookingStatus("Cancelled")).toBe("cancelled");
    expect(bookingStatus("no-show")).toBe("noshow");
    expect(bookingStatus("showed")).toBe("showed");
  });

  it("classifies devices coarsely", () => {
    expect(deviceFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18)")).toBe(
      "mobile",
    );
    expect(deviceFromUserAgent("Mozilla/5.0 (Windows NT 10.0)")).toBe("desktop");
    expect(deviceFromUserAgent(null)).toBe("unknown");
  });

  it("drops unknown visit fields, including any ad-platform identifier", () => {
    const parsed = visitContextSchema.parse({
      clinicLocation: "glasgow",
      utmCampaign: "glasgow-launch",
      fbclid: "should-not-survive",
    });
    expect(parsed).toMatchObject({
      clinicLocation: "glasgow",
      utmCampaign: "glasgow-launch",
      fromMetaAd: false,
    });
    expect(parsed).not.toHaveProperty("fbclid");
  });
});

describe("calendar prefill", () => {
  it("fills the GoHighLevel calendar with the visitor's details", () => {
    const url = new URL(
      prefilledCalendarUrl("https://link.example.com/widget/bookings/c", {
        firstName: "Aisha",
        lastName: "O'Neil",
        email: "aisha+test@example.com",
        phone: "07700 900123",
      }),
    );
    expect(url.searchParams.get("first_name")).toBe("Aisha");
    expect(url.searchParams.get("last_name")).toBe("O'Neil");
    expect(url.searchParams.get("email")).toBe("aisha+test@example.com");
    expect(url.searchParams.get("phone")).toBe("+447700900123");
  });

  it("normalises UK numbers and leaves international ones alone", () => {
    expect(toE164Uk("0141 488 8985")).toBe("+441414888985");
    expect(toE164Uk("+1 415 555 0100")).toBe("+14155550100");
    expect(toE164Uk("0044 20 4628 3165")).toBe("+442046283165");
  });
});
