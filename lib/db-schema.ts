// Single source of truth for the insights database. Applied idempotently by
// lib/db.ts on first use, so a fresh Docker Postgres needs no init script and
// later additive changes roll out with the deploy that needs them.
//
// No photo, face landmarks or image crops are ever stored — only the written
// outcome of the analysis, the contact details the visitor submitted, where
// they came from, and what they did next.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS analyses (
  id                uuid PRIMARY KEY,
  created_at        timestamptz NOT NULL DEFAULT now(),
  clinic_location   text NOT NULL,
  bucket            text NOT NULL,
  score             integer NOT NULL,
  narrative_source  text NOT NULL,
  used_photo        boolean NOT NULL,
  makeup_detected   boolean NOT NULL,
  framing_adequate  boolean NOT NULL,
  zones_obscured    text[] NOT NULL DEFAULT '{}',
  zone_severity     jsonb NOT NULL DEFAULT '{}',
  zone_improvement  jsonb NOT NULL DEFAULT '{}',
  top_zone          text,
  top_severity      integer,
  headline          text,
  narrative         text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  utm_content       text,
  utm_term          text,
  from_meta_ad      boolean NOT NULL DEFAULT false,
  landing_path      text,
  referrer_host     text,
  device            text,
  lead_at           timestamptz,
  first_name        text,
  last_name         text,
  email             text,
  phone             text,
  phone_key         text
);
CREATE INDEX IF NOT EXISTS analyses_created_idx ON analyses (created_at DESC);
CREATE INDEX IF NOT EXISTS analyses_email_idx ON analyses (email);
CREATE INDEX IF NOT EXISTS analyses_phone_key_idx ON analyses (phone_key);

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS from_google_ad boolean NOT NULL DEFAULT false;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS spot_type text;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS secondary_spot_type text;

CREATE TABLE IF NOT EXISTS events (
  id           bigserial PRIMARY KEY,
  analysis_id  uuid NOT NULL REFERENCES analyses (id) ON DELETE CASCADE,
  type         text NOT NULL,
  at           timestamptz NOT NULL DEFAULT now(),
  detail       text
);
CREATE INDEX IF NOT EXISTS events_analysis_idx ON events (analysis_id, type);

CREATE TABLE IF NOT EXISTS bookings (
  id              bigserial PRIMARY KEY,
  received_at     timestamptz NOT NULL DEFAULT now(),
  analysis_id     uuid REFERENCES analyses (id) ON DELETE SET NULL,
  appointment_id  text UNIQUE,
  status          text NOT NULL DEFAULT 'booked',
  start_time      timestamptz,
  calendar        text,
  email           text,
  phone_key       text,
  name            text
);
CREATE INDEX IF NOT EXISTS bookings_analysis_idx ON bookings (analysis_id);
`;
