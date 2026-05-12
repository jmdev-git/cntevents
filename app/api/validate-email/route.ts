import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_FILE =
  process.env.NODE_ENV === 'production'
    ? path.join(os.tmpdir(), 'cnt_allowed_emails.json')
    : path.join(process.cwd(), 'data', 'allowed_emails.json');

function getAllowedEmails(): string[] {
  // Try file first
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch { /* fall through */ }

  // Fallback to .env
  return (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ valid: false });

  const allowed = getAllowedEmails();
  const valid = allowed.includes(email.trim().toLowerCase());
  return NextResponse.json({ valid });
}
