import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_FILE = process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'cnt_registrations.json')
  : path.join(process.cwd(), 'data', 'registrations.json');

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

export interface RegistrationRecord {
  id: string;
  name: string;
  email: string;
  birthday: string;
  department: string;
  businessUnit: string;
  registeredAt: string;
}

function readRecords(): RegistrationRecord[] {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeRecords(records: RegistrationRecord[]) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

// GET — list all registrations (admin only)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(readRecords());
}

// POST — save a new registration (public, called on form submit)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, name, email, birthday, department, businessUnit } = body;

  if (!id || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const records = readRecords();

  // Prevent duplicate registrations
  const already = records.find(r => r.email.toLowerCase() === email.toLowerCase());
  if (already) {
    return NextResponse.json({ duplicate: true, record: already });
  }

  const newRecord: RegistrationRecord = {
    id,
    name: name || '',
    email,
    birthday: birthday || '',
    department: department || '',
    businessUnit: businessUnit || '',
    registeredAt: new Date().toISOString(),
  };

  records.push(newRecord);
  writeRecords(records);

  return NextResponse.json({ success: true, record: newRecord });
}

// DELETE — reset all registrations (admin only)
export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  writeRecords([]);
  return NextResponse.json({ success: true });
}
