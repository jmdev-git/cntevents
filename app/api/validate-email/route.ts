import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_FILE =
  process.env.NODE_ENV === 'production'
    ? path.join(os.tmpdir(), 'cnt_allowed_emails.json')
    : path.join(process.cwd(), 'data', 'allowed_emails.json');

function getAllowedEmails(): string[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* fall through */ }

  // Fallback to .env only if file is missing or empty
  return (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body?.email ?? '').trim().toLowerCase();
  if (!email) return NextResponse.json({ valid: false });

  const allowed = getAllowedEmails();
  const valid = allowed.includes(email);
  return NextResponse.json({ valid });
}
