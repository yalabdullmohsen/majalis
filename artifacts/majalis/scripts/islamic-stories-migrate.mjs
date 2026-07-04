#!/usr/bin/env node
import pg from "pg";
const { Client } = pg;

const client = new Client({
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.ngmvmlulzacrlicuagyp",
  password: decodeURIComponent("%2F%2FHdx%3FY6m%2CDG3QH"),
  ssl: { rejectUnauthorized: false },
});

const CREATE = `
CREATE TABLE IF NOT EXISTS islamic_stories (
  id              SERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('صحابة','فتوحات','تاريخ')),
  era             TEXT NOT NULL CHECK (era IN ('نبوي','راشدي','أموي','عباسي','عثماني','حديث')),
  summary         TEXT NOT NULL,
  full_content    TEXT NOT NULL,
  key_lessons     JSONB NOT NULL DEFAULT '[]',
  related_figures JSONB NOT NULL DEFAULT '[]',
  sources         JSONB NOT NULL DEFAULT '[]',
  tags            JSONB NOT NULL DEFAULT '[]',
  icon            TEXT DEFAULT '📖',
  is_approved     BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by     TEXT,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_islamic_stories_category ON islamic_stories(category);
CREATE INDEX IF NOT EXISTS idx_islamic_stories_era      ON islamic_stories(era);
CREATE INDEX IF NOT EXISTS idx_islamic_stories_approved ON islamic_stories(is_approved);

CREATE OR REPLACE FUNCTION update_islamic_stories_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_islamic_stories_updated_at ON islamic_stories;
CREATE TRIGGER trg_islamic_stories_updated_at
  BEFORE UPDATE ON islamic_stories FOR EACH ROW
  EXECUTE FUNCTION update_islamic_stories_updated_at();
`;

await client.connect();
console.log("✅ متصل");
await client.query(CREATE);
console.log("✅ جدول islamic_stories جاهز");
await client.end();
