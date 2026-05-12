import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_FILE =
  process.env.NODE_ENV === 'production'
    ? path.join(os.tmpdir(), 'cnt_allowed_emails.json')
    : path.join(process.cwd(), 'data', 'allowed_emails.json');

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(DATA_FILE)) {
    // Seed from .env on first run
    const fromEnv = (process.env.ALLOWED_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    fs.writeFileSync(DATA_FILE, JSON.stringify([...new Set(fromEnv)], null, 2), 'utf-8');
  }
}

function readEmails(): string[] {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeEmails(emails: string[]) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify([...new Set(emails)], null, 2), 'utf-8');
}

// GET — list all allowed emails (admin only)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(readEmails());
}

// POST — add one or many emails (admin only)
// Body: { emails: string[] }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const incoming: string[] = (body.emails ?? [])
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  if (incoming.length === 0)
    return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });

  const current = readEmails();
  const currentSet = new Set(current);
  const duplicates = incoming.filter(e => currentSet.has(e));
  const newOnes = incoming.filter(e => !currentSet.has(e));
  const merged = [...current, ...newOnes];
  writeEmails(merged);

  return NextResponse.json({
    added: newOnes.length,
    duplicates: duplicates.length,
    duplicateList: duplicates,
    total: merged.length,
  });
}

// DELETE — remove a single email or all emails (admin only)
// Body: { email: string } OR { deleteAll: true }
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (body.deleteAll === true) {
    writeEmails([]);
    return NextResponse.json({ removed: 'all', total: 0 });
  }

  const { email } = body;
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const current = readEmails();
  const updated = current.filter(e => e !== email.trim().toLowerCase());
  writeEmails(updated);

  return NextResponse.json({ removed: current.length - updated.length, total: updated.length });
}
