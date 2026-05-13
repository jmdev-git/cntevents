-- Run this in your Neon dashboard SQL Editor to create all tables

CREATE TABLE IF NOT EXISTS registrations (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL DEFAULT '',
  email          TEXT NOT NULL UNIQUE,
  birthday       TEXT NOT NULL DEFAULT '',
  department     TEXT NOT NULL DEFAULT '',
  business_unit  TEXT NOT NULL DEFAULT '',
  registered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id               TEXT PRIMARY KEY,
  registration_id  TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL DEFAULT '',
  email            TEXT NOT NULL,
  birthday         TEXT NOT NULL DEFAULT '',
  department       TEXT NOT NULL DEFAULT '',
  business_unit    TEXT NOT NULL DEFAULT '',
  scanned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allowed_emails (
  email TEXT PRIMARY KEY
);
