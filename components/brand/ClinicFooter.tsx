import { Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { CLINIC, DISCLAIMER } from "@/lib/constants";
import { Logo } from "./Logo";

export function ClinicFooter() {
  return (
    <footer className="mt-auto border-t border-peach/15 bg-ink px-6 py-12 text-white/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo tone="light" withByline />
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            {CLINIC.tagline}.
          </p>
        </div>

        <div className="space-y-4 text-sm">
          <p className="font-serif text-base text-white">Our clinics</p>
          {CLINIC.locations.map((loc) => (
            <div key={loc.city} className="space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-peach">
                {loc.city}
              </p>
              {loc.lines.map((l) => (
                <p key={l} className="text-white/65">
                  {l}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-serif text-base text-white">Get in touch</p>
          <a
            href={CLINIC.phoneHref}
            className="flex items-center gap-2 text-white/80 transition hover:text-peach-light"
          >
            <Phone size={14} /> {CLINIC.phone}
          </a>
          <a
            href={CLINIC.whatsappHref}
            className="flex items-center gap-2 text-white/80 transition hover:text-peach-light"
          >
            <MessageCircle size={14} /> WhatsApp {CLINIC.whatsapp}
          </a>
          <a
            href={`mailto:${CLINIC.email}`}
            className="flex items-center gap-2 text-white/80 transition hover:text-peach-light"
          >
            <Mail size={14} /> {CLINIC.email}
          </a>
          <p className="flex items-center gap-2 text-white/55">
            <Clock size={14} /> {CLINIC.hours}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-5xl border-t border-white/10 pt-6">
        <p className="text-xs leading-relaxed text-white/45">{DISCLAIMER}</p>
        <p className="mt-3 text-xs text-white/40">
          © {CLINIC.name} · {CLINIC.byline}
        </p>
      </div>
    </footer>
  );
}
